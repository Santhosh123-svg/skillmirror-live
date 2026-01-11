const Task = require('../models/Task');

const getTasksBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.user.userId;
    const tasks = await Task.find({ skillId, userId }).sort({ createdAt: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tasks = await Task.find({ userId }).populate('skillId');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

const submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    const { submissionContent, language } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== userId) return res.status(403).json({ message: 'Unauthorized' });
    if (!submissionContent || !submissionContent.trim()) return res.status(400).json({ message: 'Code cannot be empty' });

    // ✅ Get skill info from task to validate category
    const skill = await Task.findById(taskId).select('skillId');
    
    let validationResult = await validateCode(submissionContent, language, task, task.skillId);
    
    console.log(`📊 Task: ${task.title} | Tests: ${validationResult.passedTests}/${validationResult.totalTests} | Correct: ${validationResult.isCorrect}`);

    task.status = validationResult.isCorrect ? 'completed' : 'submitted';
    task.submissionDate = new Date();
    task.submissionContent = submissionContent;
    task.submissionLanguage = language;
    task.validationResult = validationResult;
    await task.save();

    const failedCount = validationResult.totalTests - validationResult.passedTests;
    
    res.json({
      message: validationResult.isCorrect 
        ? '🎉 Perfect! All tests passed!'
        : `⚠️ ${failedCount} test(s) failed. Keep trying!`,
      task,
      validationResult,
      feedback: {
        totalTests: validationResult.totalTests,
        passedTests: validationResult.passedTests,
        failedTests: failedCount,
        score: validationResult.score,
        testDetails: validationResult.testResults,
        errorSummary: validationResult.testResults
          .filter(t => !t.passed)
          .map(t => `${t.testName}: ${t.message}`)
      }
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Failed to submit task', error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { skillId, title, description } = req.body;
    const userId = req.user.userId;
    if (!skillId || !title) return res.status(400).json({ message: 'Skill and title required' });

    const newTask = new Task({ skillId, userId, title, description, status: 'pending' });
    await newTask.save();
    res.status(201).json({ message: 'Task created', task: newTask });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task' });
  }
};

const getTasksWithProgression = async (req, res) => {
  try {
    const { skillId } = req.params;
    const userId = req.user.userId;
    const tasks = await Task.find({ skillId, userId }).sort({ createdAt: 1 });

    let tasksWithStatus = [];
    let allCompleted = true;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (task.status === 'completed') {
        tasksWithStatus.push({ ...task.toObject(), locked: false, available: true, position: i + 1 });
      } else if (allCompleted) {
        tasksWithStatus.push({ ...task.toObject(), locked: false, available: true, position: i + 1 });
        allCompleted = false;
      } else {
        tasksWithStatus.push({ ...task.toObject(), locked: true, available: false, position: i + 1 });
      }
    }

    res.json(tasksWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

// ✅ MAIN VALIDATION ENGINE WITH CATEGORY CHECK
async function validateCode(code, language, task, skillId) {
  try {
    console.log(`🔍 Validating ${language} code for task: ${task.title}`);

    if (!code || code.trim().length === 0) {
      return { 
        isCorrect: false, 
        passedTests: 0, 
        totalTests: 1, 
        score: 0, 
        testResults: [{ testName: 'Code Empty', passed: false, message: 'Code cannot be empty' }],
        timestamp: new Date()
      };
    }

    // ✅ Get category from task skillId to validate category
    const taskCategory = getTaskCategory(task.title);
    
    const testCases = getTestCases(task.title, language, taskCategory);
    
    if (!testCases || testCases.length === 0) {
      return { 
        isCorrect: false, 
        passedTests: 0, 
        totalTests: 1, 
        score: 0, 
        testResults: [{ testName: 'No Tests', passed: false, message: 'Task validation not configured' }],
        timestamp: new Date()
      };
    }

    // ✅ First check: Category validation
    const categoryCheck = validateCategory(code, taskCategory);
    if (!categoryCheck.passed) {
      return { 
        isCorrect: false, 
        passedTests: 0, 
        totalTests: testCases.length, 
        score: 0, 
        testResults: [
          { testName: '⚠️ Category Check', passed: false, message: categoryCheck.error }
        ],
        timestamp: new Date()
      };
    }

    let passedTests = 0;
    let testResults = [];

    // Run each test case
    for (let test of testCases) {
      try {
        let result = runTest(code, language, test);
        if (result.passed === true) {
          passedTests++;
          testResults.push({ testName: test.name, passed: true, message: `✅ ${test.name}` });
          console.log(`✅ PASSED: ${test.name}`);
        } else {
          testResults.push({ testName: test.name, passed: false, message: `❌ ${result.error}` });
          console.log(`❌ FAILED: ${test.name} - ${result.error}`);
        }
      } catch (e) {
        testResults.push({ testName: test.name, passed: false, message: `❌ ${e.message}` });
        console.log(`❌ ERROR: ${test.name} - ${e.message}`);
      }
    }

    // ✅ Only correct if ALL tests pass
    const isCorrect = passedTests === testCases.length && passedTests > 0;
    const score = Math.round((passedTests / testCases.length) * 100);

    console.log(`📊 Final Score: ${score}% (${passedTests}/${testCases.length}) - ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);

    return { 
      isCorrect, 
      passedTests, 
      totalTests: testCases.length, 
      score, 
      testResults,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Validation error:', error);
    return { 
      isCorrect: false, 
      passedTests: 0, 
      totalTests: 1, 
      score: 0, 
      testResults: [{ testName: 'Error', passed: false, message: error.message }],
      timestamp: new Date()
    };
  }
}

// ✅ NEW: Category validation
function getTaskCategory(taskTitle) {
  const htmlCssTasks = ['responsive navigation bar', 'professional landing page', 'card layout', 'form with validation', 'multi-section webpage'];
  const jsTasks = ['todo list', 'calculator', 'stopwatch', 'filter and search', 'quote generator'];
  const reactTasks = ['React component', 'React form', 'React list', 'React counter', 'React API'];
  const nodeTasks = ['Node.js server', 'GET route', 'POST route', 'Connect to database', 'Create middleware'];
  const mongoTasks = ['MongoDB schema', 'Query MongoDB', 'Insert data', 'Update MongoDB', 'Delete MongoDB'];

  if (htmlCssTasks.some(t => taskTitle.toLowerCase().includes(t.toLowerCase()))) return 'HTML/CSS';
  if (jsTasks.some(t => taskTitle.toLowerCase().includes(t.toLowerCase()))) return 'JavaScript';
  if (reactTasks.some(t => taskTitle.toLowerCase().includes(t.toLowerCase()))) return 'React';
  if (nodeTasks.some(t => taskTitle.toLowerCase().includes(t.toLowerCase()))) return 'Node.js';
  if (mongoTasks.some(t => taskTitle.toLowerCase().includes(t.toLowerCase()))) return 'MongoDB';

  return 'Unknown';
}

// ✅ NEW: Category check before running tests
function validateCategory(code, category) {
  const categoryIndicators = {
    'HTML/CSS': [/<html|<head|<body|<div|<nav|<section|<footer|\.css|color:|background/i],
    'JavaScript': [/function\s+\w+|const\s+\w+\s*=|let\s+\w+|var\s+\w+|\.map\(|\.filter\(|addEventListener/i],
    'React': [/import.*from\s+['"']react|useState|useEffect|<.*>.*<\/|jsx/i],
    'Node.js': [/express|require|app\.get|app\.post|app\.listen/i],
    'MongoDB': [/Schema|mongoose|model|findByIdAndUpdate|findByIdAndDelete/i]
  };

  const indicators = categoryIndicators[category];
  if (!indicators) return { passed: true };

  const hasIndicator = indicators.some(regex => regex.test(code));
  
  if (!hasIndicator) {
    return { 
      passed: false, 
      error: `❌ This task requires ${category} code. You submitted ${detectLanguage(code)} code.` 
    };
  }

  return { passed: true };
}

// ✅ NEW: Detect language from code
function detectLanguage(code) {
  if (/<html|<head|<body|<div|<nav/.test(code)) return 'HTML/CSS';
  if (/import.*from\s+['"]react/.test(code)) return 'React';
  if (/express|require.*express|app\.get|app\.post/.test(code)) return 'Node.js';
  if (/Schema|mongoose|model|\.findByIdAndUpdate/.test(code)) return 'MongoDB';
  if (/function\s+\w+|const\s+\w+\s*=|\.map\(|\.filter\(/.test(code)) return 'JavaScript';
  return 'Unknown';
}

// Test runner
function runTest(code, language, testCase) {
  try {
    const result = testCase.validate(code);
    return result === true ? { passed: true } : { passed: false, error: 'Validation failed' };
  } catch (error) {
    return { passed: false, error: error.message };
  }
}

// ✅ Test cases for all tasks (same as before, no changes needed here)
function getTestCases(taskTitle, language, category) {
  const lang = (language || 'javascript').toLowerCase().trim();

  const testCases = {
    // ===== HTML & CSS SKILL (5 TASKS) =====
    'Create a responsive navigation bar': [
      { name: 'Exactly <nav> tag', validate: (code) => { if (!/<nav[\s\S]*<\/nav>/.test(code)) throw new Error('Need <nav></nav>'); return true; } },
      { name: 'Has <ul><li><a> structure', validate: (code) => { if (!/<ul[\s\S]*<li[\s\S]*<a/.test(code)) throw new Error('Missing ul>li>a'); return true; } },
      { name: 'nav { } CSS rule', validate: (code) => { if (!/nav\s*\{[\s\S]*\}|nav\s*\{[\s\S]*display|nav\s*\{[\s\S]*color/.test(code)) throw new Error('Missing nav CSS'); return true; } },
      { name: '@media query for responsive', validate: (code) => { if (!/@media\s*\(\s*max-width/.test(code)) throw new Error('Missing responsive design'); return true; } },
      { name: 'Links must be styled', validate: (code) => { if (!/a\s*\{[\s\S]*\}|a\s*\{[\s\S]*(color|text-decoration|padding)/.test(code)) throw new Error('Links not styled'); return true; } }
    ],

    'Design a professional landing page': [
      { name: 'DOCTYPE html required', validate: (code) => { if (!/<!DOCTYPE\s+html/i.test(code)) throw new Error('Missing DOCTYPE'); return true; } },
      { name: '<html> <head> <body> tags', validate: (code) => { if (!/<html[\s\S]*<head[\s\S]*<body/.test(code)) throw new Error('Missing HTML structure'); return true; } },
      { name: '<header> with <nav> inside', validate: (code) => { if (!/<header[\s\S]*<nav/.test(code)) throw new Error('Header must contain nav'); return true; } },
      { name: '2+ <section> with different content', validate: (code) => { if ((code.match(/<section/g) || []).length < 2) throw new Error('Need 2+ sections'); return true; } },
      { name: '<footer> with copyright', validate: (code) => { if (!/<footer[\s\S]*(©|copyright|&copy;)/.test(code)) throw new Error('Footer needs copyright'); return true; } },
      { name: 'color: and background-color in CSS', validate: (code) => { if (!/color\s*:|background-color\s*:|background\s*:/.test(code)) throw new Error('Missing colors'); return true; } },
      { name: '<title> in head', validate: (code) => { if (!/<title[\s\S]*<\/title>/.test(code)) throw new Error('Missing page title'); return true; } }
    ],

    'Build a responsive card layout': [
      { name: 'class="card" elements (2+)', validate: (code) => { if ((code.match(/class\s*=\s*["\'][\w\s]*card[\w\s]*["\']/g) || []).length < 2) throw new Error('Need 2+ cards'); return true; } },
      { name: 'display: grid required', validate: (code) => { if (!/display\s*:\s*grid/.test(code)) throw new Error('Must use CSS Grid'); return true; } },
      { name: 'grid-template-columns defined', validate: (code) => { if (!/grid-template-columns/.test(code)) throw new Error('Missing grid columns'); return true; } },
      { name: '@media for mobile layout', validate: (code) => { if (!/@media[\s\S]*grid-template-columns\s*:\s*1fr/.test(code)) throw new Error('No mobile responsiveness'); return true; } },
      { name: 'Card padding and margin', validate: (code) => { if (!/\.card\s*\{[\s\S]*(padding|margin)/.test(code)) throw new Error('Cards need spacing'); return true; } }
    ],

    'Create a form with validation': [
      { name: '<form> with id attribute', validate: (code) => { if (!/<form\s+id\s*=/.test(code)) throw new Error('Form needs id'); return true; } },
      { name: '2+ <input> with type attribute', validate: (code) => { if ((code.match(/<input[^>]*type\s*=/g) || []).length < 2) throw new Error('Need 2+ inputs'); return true; } },
      { name: '<label> for each input', validate: (code) => { if ((code.match(/<label/g) || []).length < 2) throw new Error('Labels for all inputs'); return true; } },
      { name: '<input type="submit"> button', validate: (code) => { if (!/type\s*=\s*["\']submit["\']/i.test(code)) throw new Error('Missing submit button'); return true; } },
      { name: 'form {} CSS with border', validate: (code) => { if (!/form\s*\{[\s\S]*(border|padding|background)/.test(code)) throw new Error('Form CSS styling needed'); return true; } },
      { name: 'input {} CSS styling', validate: (code) => { if (!/input\s*\{[\s\S]*(padding|border|font)/.test(code)) throw new Error('Input styling needed'); return true; } }
    ],

    'Build a multi-section webpage': [
      { name: '3+ <section> elements', validate: (code) => { if ((code.match(/<section/g) || []).length < 3) throw new Error('Need 3+ sections'); return true; } },
      { name: '<nav> or <header><nav>', validate: (code) => { if (!/<nav|<header[\s\S]*<nav/.test(code)) throw new Error('Must have navigation'); return true; } },
      { name: '<footer> at bottom', validate: (code) => { if (!/<footer[\s\S]*<\/footer>[\s\S]*$/.test(code)) throw new Error('Footer must be at end'); return true; } },
      { name: 'section {} CSS rule', validate: (code) => { if (!/section\s*\{[\s\S]*(padding|margin|background)/.test(code)) throw new Error('Section CSS needed'); return true; } },
      { name: 'Different content in each', validate: (code) => { if ((code.match(/<section[\s\S]*?<h[1-6]/g) || []).length < 3) throw new Error('Sections need headings'); return true; } }
    ],

    // ===== JAVASCRIPT SKILL (5 TASKS) =====
    'Build a todo list application': lang === 'python' ? 
      [
        { name: 'def addTodo()', validate: (code) => { if (!/def\s+add[\w]*\(/.test(code)) throw new Error('Missing add function'); return true; } },
        { name: 'def deleteTodo()', validate: (code) => { if (!/def\s+(delete|remove)[\w]*\(/.test(code)) throw new Error('Missing delete'); return true; } },
        { name: 'todos = [] list', validate: (code) => { if (!/todos\s*=\s*\[\]/.test(code)) throw new Error('Missing todos list'); return true; } },
        { name: 'append() method', validate: (code) => { if (!/\.append\(/.test(code)) throw new Error('Missing append'); return true; } },
        { name: 'print() output', validate: (code) => { if (!/print\(/.test(code)) throw new Error('Missing print'); return true; } }
      ] :
      [
        { name: 'function add()', validate: (code) => { if (!/function\s+add\(|const\s+add\s*=\s*\(/.test(code)) throw new Error('Missing add'); return true; } },
        { name: 'function delete()', validate: (code) => { if (!/function\s+(delete|remove)\(|const\s+(delete|remove)\s*=\s*\(/.test(code)) throw new Error('Missing delete'); return true; } },
        { name: 'todos = [] array', validate: (code) => { if (!/todos\s*=\s*\[\]|const\s+todos\s*=\s*\[\]/.test(code)) throw new Error('Missing array'); return true; } },
        { name: 'todos.push()', validate: (code) => { if (!/todos\.push\(/.test(code)) throw new Error('Missing push'); return true; } },
        { name: '.filter() for delete', validate: (code) => { if (!/\.filter\(/.test(code)) throw new Error('Missing filter'); return true; } },
        { name: 'document.getElementById/querySelector', validate: (code) => { if (!/document\.getElementById|document\.querySelector/.test(code)) throw new Error('Missing DOM'); return true; } }
      ],

    'Create a calculator with basic operations': lang === 'python' ?
      [
        { name: 'def calculate(a,b,op)', validate: (code) => { if (!/def\s+calculate\s*\(\s*\w+\s*,\s*\w+\s*,\s*\w+\s*\)/.test(code)) throw new Error('Wrong function signature'); return true; } },
        { name: 'a + b addition', validate: (code) => { if (!/if[\s\S]*[\'\"]\+[\'\"]\s*:[\s\S]*\+|a\s*\+\s*b/.test(code)) throw new Error('Missing addition'); return true; } },
        { name: 'a - b subtraction', validate: (code) => { if (!/if[\s\S]*[\'\"][\-][\'\"]\s*:[\s\S]*\-|a\s*\-\s*b/.test(code)) throw new Error('Missing subtraction'); return true; } },
        { name: 'a * b multiplication', validate: (code) => { if (!/if[\s\S]*[\'\"][*][\'\"]\s*:[\s\S]*\*|a\s*\*\s*b/.test(code)) throw new Error('Missing multiply'); return true; } },
        { name: 'a / b division', validate: (code) => { if (!/if[\s\S]*[\'\"][/][\'\"]\s*:[\s\S]*\/|a\s*\/\s*b/.test(code)) throw new Error('Missing divide'); return true; } },
        { name: 'if elif else', validate: (code) => { if (!/if\s|elif\s|else\s*:/.test(code)) throw new Error('Missing conditions'); return true; } }
      ] :
      [
        { name: 'function calculate(a,b,op)', validate: (code) => { if (!/function\s+calculate\s*\(\s*\w+\s*,\s*\w+\s*,\s*\w+\s*\)|const\s+calculate\s*=\s*\(\w+,\w+,\w+\)/.test(code)) throw new Error('Wrong signature'); return true; } },
        { name: 'case "+" : a + b', validate: (code) => { if (!/case\s*[\'\"]\+[\'\"]\s*:[\s\S]*(return\s*a\s*\+\s*b|a\s*\+\s*b)/.test(code)) throw new Error('Wrong addition'); return true; } },
        { name: 'case "-" : a - b', validate: (code) => { if (!/case\s*[\'"][\-][\'\"]\s*:[\s\S]*(return\s*a\s*\-\s*b|a\s*\-\s*b)/.test(code)) throw new Error('Wrong subtraction'); return true; } },
        { name: 'case "*" : a * b', validate: (code) => { if (!/case\s*[\'"][*][\'\"]\s*:[\s\S]*(return\s*a\s*\*\s*b|a\s*\*\s*b)/.test(code)) throw new Error('Wrong multiply'); return true; } },
        { name: 'case "/" : a / b', validate: (code) => { if (!/case\s*[\'"][/][\'\"]\s*:[\s\S]*(return\s*a\s*\/\s*b|a\s*\/\s*b)/.test(code)) throw new Error('Wrong divide'); return true; } },
        { name: 'switch or if else', validate: (code) => { if (!/switch\s*\(|if\s*\(.*else\s*if|if\s*\(.*\)\s*else/.test(code)) throw new Error('Missing control'); return true; } }
      ],

    'Build a stopwatch application': lang === 'python' ?
      [
        { name: 'def start()', validate: (code) => { if (!/def\s+start\s*\(\s*\)/.test(code)) throw new Error('Missing start'); return true; } },
        { name: 'def stop()', validate: (code) => { if (!/def\s+(stop|pause)\s*\(\s*\)/.test(code)) throw new Error('Missing stop'); return true; } },
        { name: 'def reset()', validate: (code) => { if (!/def\s+reset\s*\(\s*\)/.test(code)) throw new Error('Missing reset'); return true; } },
        { name: 'import time', validate: (code) => { if (!/import\s+time|from\s+time\s+import/.test(code)) throw new Error('Missing time'); return true; } },
        { name: 'time.time() calls', validate: (code) => { if (!/time\.time\(\)/.test(code)) throw new Error('Missing time tracking'); return true; } }
      ] :
      [
        { name: 'function startTimer()', validate: (code) => { if (!/function\s+startTimer\s*\(\s*\)|const\s+startTimer\s*=\s*\(\s*\)/.test(code)) throw new Error('Missing start'); return true; } },
        { name: 'function stopTimer()', validate: (code) => { if (!/function\s+stopTimer\s*\(\s*\)|const\s+stopTimer\s*=\s*\(\s*\)/.test(code)) throw new Error('Missing stop'); return true; } },
        { name: 'function resetTimer()', validate: (code) => { if (!/function\s+resetTimer\s*\(\s*\)|const\s+resetTimer\s*=\s*\(\s*\)/.test(code)) throw new Error('Missing reset'); return true; } },
        { name: 'setInterval() timing', validate: (code) => { if (!/setInterval\s*\([\s\S]{1,200}(ms|1000|100)/.test(code)) throw new Error('Missing interval'); return true; } },
        { name: 'clearInterval()', validate: (code) => { if (!/clearInterval\s*\(/.test(code)) throw new Error('Missing clear'); return true; } }
      ],

    'Create a filter and search feature': lang === 'python' ?
      [
        { name: 'def filter_items()', validate: (code) => { if (!/def\s+(filter|search)[\w]*\s*\(/.test(code)) throw new Error('Missing function'); return true; } },
        { name: 'for item in items:', validate: (code) => { if (!/for\s+\w+\s+in\s+\w+\s*:/.test(code)) throw new Error('Missing loop'); return true; } },
        { name: 'if keyword in item:', validate: (code) => { if (!/if[\s\S]*in\s+|\.find\(/.test(code)) throw new Error('Missing search'); return true; } },
        { name: 'return filtered list', validate: (code) => { if (!/return[\s\S]*\[|return\s+\w+/.test(code)) throw new Error('Missing return'); return true; } },
        { name: 'print() results', validate: (code) => { if (!/print\(/.test(code)) throw new Error('Missing output'); return true; } }
      ] :
      [
        { name: '.filter() method', validate: (code) => { if (!/\.filter\s*\(\s*[\w]\s*=>\s*/.test(code)) throw new Error('Missing filter'); return true; } },
        { name: '.includes() search', validate: (code) => { if (!/\.includes|\.indexOf|\.match|\.search/.test(code)) throw new Error('Missing search'); return true; } },
        { name: '.map() display', validate: (code) => { if (!/\.map\s*\(\s*[\w]\s*=>\s*/.test(code)) throw new Error('Missing map'); return true; } },
        { name: 'addEventListener()', validate: (code) => { if (!/addEventListener\s*\([\s\S]{1,50}(input|change|keyup)/.test(code)) throw new Error('Missing event'); return true; } },
        { name: 'document.querySelector', validate: (code) => { if (!/document\.querySelector|getElementById/.test(code)) throw new Error('Missing DOM'); return true; } }
      ],

    'Build a quote generator': lang === 'python' ?
      [
        { name: 'quotes = [...]', validate: (code) => { if (!/quotes\s*=\s*\[[\s\S]*[\'\"][\s\S]*[\'\"]\s*\]/.test(code)) throw new Error('Missing array'); return true; } },
        { name: 'import random', validate: (code) => { if (!/import\s+random|from\s+random\s+import/.test(code)) throw new Error('Missing random'); return true; } },
        { name: 'def get_quote()', validate: (code) => { if (!/def\s+(get_quote|display_quote|show_quote)\s*\(\s*\)/.test(code)) throw new Error('Missing function'); return true; } },
        { name: 'random.choice()', validate: (code) => { if (!/random\.choice\s*\(/.test(code)) throw new Error('Missing choice'); return true; } },
        { name: 'print quote', validate: (code) => { if (!/print\([\s\S]*quote/.test(code)) throw new Error('Missing output'); return true; } }
      ] :
      [
        { name: 'const quotes = [...]', validate: (code) => { if (!/const\s+quotes\s*=\s*\[[\s\S]*[\'\"][\s\S]*[\'\"]\s*\]|const\s+quotes\s*=\s*\[[\s\S]*{[\s\S]*}[\s\S]*\]/.test(code)) throw new Error('Missing array'); return true; } },
        { name: 'Math.random()', validate: (code) => { if (!/Math\.random\s*\(\)/.test(code)) throw new Error('Missing random'); return true; } },
        { name: 'Math.floor()', validate: (code) => { if (!/Math\.floor\s*\(/.test(code)) throw new Error('Missing floor'); return true; } },
        { name: 'function getQuote()', validate: (code) => { if (!/function\s+(getQuote|displayQuote)\s*\(\s*\)|const\s+(getQuote|displayQuote)\s*=\s*\(\s*\)/.test(code)) throw new Error('Missing function'); return true; } },
        { name: 'innerHTML update', validate: (code) => { if (!/\.innerHTML\s*=|document\.querySelector[\s\S]*\.textContent\s*=/.test(code)) throw new Error('Missing DOM update'); return true; } }
      ],

    // ===== REACT SKILL (5 TASKS) =====
    'Create a React component': [
      { name: 'function Component()', validate: (code) => { if (!/function\s+\w+\s*\(\s*props?\s*\)/.test(code)) throw new Error('Missing component'); return true; } },
      { name: 'return (<jsx>)', validate: (code) => { if (!/return\s*\([\s\S]*<\w+/.test(code)) throw new Error('Missing JSX'); return true; } },
      { name: 'props.property used', validate: (code) => { if (!/props\.\w+|props\[\s*[\'"]/.test(code)) throw new Error('Props not used'); return true; } },
      { name: 'export default Component', validate: (code) => { if (!/export\s+default\s+\w+/.test(code)) throw new Error('Missing export'); return true; } }
    ],

    'Build a React form': [
      { name: 'import React from "react"', validate: (code) => { if (!/import\s+React\s+from\s+[\'"]react[\'"]/.test(code)) throw new Error('Missing React'); return true; } },
      { name: 'useState()', validate: (code) => { if (!/useState\s*\([\s\S]{1,50}\)/.test(code)) throw new Error('Missing useState'); return true; } },
      { name: '<input> with onChange', validate: (code) => { if (!/<input[\s\S]*onChange\s*=/.test(code)) throw new Error('Input onChange'); return true; } },
      { name: '<form> with onSubmit', validate: (code) => { if (!/<form[\s\S]*onSubmit\s*=/.test(code)) throw new Error('Form onSubmit'); return true; } },
      { name: 'setFormData() setter', validate: (code) => { if (!/set\w+\(|setData\(|setState\(/.test(code)) throw new Error('Missing setter'); return true; } }
    ],

    'Build a React list with map': [
      { name: '.map((item) => ...)', validate: (code) => { if (!/\.map\s*\(\s*\w+\s*=>\s*/.test(code)) throw new Error('Missing map'); return true; } },
      { name: 'key={item.id}', validate: (code) => { if (!/key\s*=\s*\{\s*[\w.]+\s*\}/.test(code)) throw new Error('Missing key'); return true; } },
      { name: 'return <Component/>', validate: (code) => { if (!/return\s*[\w\W]{1,50}<\w+[\s\S]*\/>/i.test(code)) throw new Error('Missing JSX'); return true; } },
      { name: 'useState for array', validate: (code) => { if (!/useState\s*\(\s*\[\]/.test(code)) throw new Error('Missing state'); return true; } }
    ],

    'Create a React counter': [
      { name: 'const [count, setCount]', validate: (code) => { if (!/useState\s*\(\s*[\d]+\s*\)/.test(code)) throw new Error('Missing state'); return true; } },
      { name: 'onClick={() => setCount(count + 1)}', validate: (code) => { if (!/setCount[\s\S]{1,100}count\s*\+/.test(code)) throw new Error('Missing increment'); return true; } },
      { name: 'onClick={() => setCount(count - 1)}', validate: (code) => { if (!/setCount[\s\S]{1,100}count\s*\-/.test(code)) throw new Error('Missing decrement'); return true; } },
      { name: '<button onClick', validate: (code) => { if (!/<button[\s\S]*onClick/.test(code)) throw new Error('Missing button'); return true; } }
    ],

    'Build a React API component': [
      { name: 'useEffect(() => {...})', validate: (code) => { if (!/useEffect\s*\(\s*\(\s*\)\s*=>\s*/.test(code)) throw new Error('Missing useEffect'); return true; } },
      { name: 'fetch() or axios.get()', validate: (code) => { if (!/fetch\s*\([\s\S]{1,50}then|axios\.get\s*\(/.test(code)) throw new Error('Missing fetch'); return true; } },
      { name: 'useState for loading', validate: (code) => { if (!/useState\s*\(\s*true|useState\s*\(\s*false/.test(code)) throw new Error('Missing loading'); return true; } },
      { name: 'data.map() render', validate: (code) => { if (!/\.map\s*\(\s*[\w]+\s*=>\s*/.test(code)) throw new Error('Missing render'); return true; } }
    ],

    // ===== NODE.JS SKILL (5 TASKS) =====
    'Create a Node.js server': [
      { name: 'const express = require()', validate: (code) => { if (!/const\s+express\s*=\s*require\s*\(\s*[\'"]express[\'"]/.test(code)) throw new Error('Missing require'); return true; } },
      { name: 'const app = express()', validate: (code) => { if (!/const\s+app\s*=\s*express\s*\(\s*\)/.test(code)) throw new Error('Missing app'); return true; } },
      { name: 'app.listen(port, callback)', validate: (code) => { if (!/app\.listen\s*\(\s*[\d]+[\s\S]{1,100}\(\s*\)/.test(code)) throw new Error('Missing listen'); return true; } },
      { name: 'console.log() message', validate: (code) => { if (!/console\.log\s*\([\s\S]{1,50}listen|port|server/.test(code)) throw new Error('Missing log'); return true; } }
    ],

    'Create GET route': [
      { name: 'app.get("/path")', validate: (code) => { if (!/app\.get\s*\(\s*[\'"]\/[\w\/]*[\'"]/.test(code)) throw new Error('Missing route'); return true; } },
      { name: '(req, res) => {}', validate: (code) => { if (!/\(\s*req\s*,\s*res\s*\)\s*=>\s*\{/.test(code)) throw new Error('Missing handler'); return true; } },
      { name: 'res.json() response', validate: (code) => { if (!/res\.json\s*\([\s\S]{1,100}\)|res\.json\s*\([\s\S]{1,50}\{/.test(code)) throw new Error('Missing json'); return true; } },
      { name: 'Send object/array', validate: (code) => { if (!/res\.json\s*\(\s*\{|res\.json\s*\(\s*\[/.test(code)) throw new Error('Send valid JSON'); return true; } }
    ],

    'Create POST route': [
      { name: 'app.post("/path")', validate: (code) => { if (!/app\.post\s*\(\s*[\'"]\/[\w\/]*[\'"]/.test(code)) throw new Error('Missing post'); return true; } },
      { name: 'app.use(express.json())', validate: (code) => { if (!/app\.use\s*\(\s*express\.json\s*\(\s*\)/.test(code)) throw new Error('Missing json parser'); return true; } },
      { name: 'req.body access', validate: (code) => { if (!/req\.body[\s\S]{1,50}|const\s+\w+\s*=\s*req\.body/.test(code)) throw new Error('Missing body'); return true; } },
      { name: 'res.json() response', validate: (code) => { if (!/res\.json\s*\([\s\S]{1,50}\)|res\.status[\s\S]*json/.test(code)) throw new Error('Missing response'); return true; } }
    ],

    'Connect to database': [
      { name: 'require("mongoose")', validate: (code) => { if (!/require\s*\(\s*[\'"]mongoose[\'"]/.test(code)) throw new Error('Missing mongoose'); return true; } },
      { name: 'mongoose.connect(uri)', validate: (code) => { if (!/mongoose\.connect\s*\(\s*[\'"]mongodb/.test(code)) throw new Error('Missing connect'); return true; } },
      { name: '.then().catch()', validate: (code) => { if (!/\.then\s*\([\s\S]{1,100}catch\s*\(|\.catch\s*\(/.test(code)) throw new Error('Missing error handling'); return true; } },
      { name: 'console.log success', validate: (code) => { if (!/console\.log\s*\([\s\S]{1,50}(success|connected|MongoDB)/.test(code)) throw new Error('Missing log'); return true; } }
    ],

    'Create middleware': [
      { name: 'const middleware = (req, res, next)', validate: (code) => { if (!/const\s+\w+\s*=\s*\(\s*req\s*,\s*res\s*,\s*next\s*\)/.test(code)) throw new Error('Missing function'); return true; } },
      { name: 'console.log() or logic', validate: (code) => { if (!/console\.log|req\.|res\./.test(code)) throw new Error('Missing logic'); return true; } },
      { name: 'next() call', validate: (code) => { if (!/next\s*\(\s*\)/.test(code)) throw new Error('Missing next()'); return true; } },
      { name: 'app.use(middleware)', validate: (code) => { if (!/app\.use\s*\(\s*\w+/.test(code)) throw new Error('Not registered'); return true; } }
    ],

    // ===== MONGODB SKILL (5 TASKS) =====
    'Create MongoDB schema': [
      { name: 'const schema = new Schema()', validate: (code) => { if (!/const\s+\w+\s*=\s*new\s+Schema\s*\(/.test(code)) throw new Error('Missing schema'); return true; } },
      { name: 'name: { type: String }', validate: (code) => { if (!/name\s*:\s*\{[\s\S]{1,50}type\s*:\s*String/.test(code)) throw new Error('Missing fields'); return true; } },
      { name: 'email: { type: String }', validate: (code) => { if (!/email\s*:\s*\{[\s\S]{1,50}type\s*:\s*String/.test(code)) throw new Error('Email field'); return true; } },
      { name: 'module.exports mongoose.model()', validate: (code) => { if (!/module\.exports\s*=\s*mongoose\.model\s*\(/.test(code)) throw new Error('Missing export'); return true; } }
    ],

    'Query MongoDB data': [
      { name: 'User.find()', validate: (code) => { if (!/\w+\.find\s*\(\s*\)/.test(code)) throw new Error('Missing find'); return true; } },
      { name: 'async function', validate: (code) => { if (!/async\s+\w+|const\s+\w+\s*=\s*async/.test(code)) throw new Error('Missing async'); return true; } },
      { name: 'await Model.find()', validate: (code) => { if (!/await\s+[\w.]+\.find/.test(code)) throw new Error('Missing await'); return true; } },
      { name: 'try catch error', validate: (code) => { if (!/try\s*\{[\s\S]{1,100}catch\s*\(/.test(code)) throw new Error('Missing try'); return true; } },
      { name: 'res.json(data)', validate: (code) => { if (!/res\.json\s*\([\s\S]{1,50}[\w]+/.test(code)) throw new Error('Missing response'); return true; } }
    ],

    'Insert data into MongoDB': [
      { name: 'new User(data)', validate: (code) => { if (!/new\s+\w+\s*\([\s\S]{1,50}\)/.test(code)) throw new Error('Missing creation'); return true; } },
      { name: 'await user.save()', validate: (code) => { if (!/await\s+[\w]+\.save\s*\(\s*\)/.test(code)) throw new Error('Missing save'); return true; } },
      { name: 'try catch block', validate: (code) => { if (!/try\s*\{[\s\S]{1,100}catch\s*\(/.test(code)) throw new Error('Missing error'); return true; } },
      { name: 'res.status(201).json()', validate: (code) => { if (!/res\.status\s*\(\s*201/.test(code)) throw new Error('Missing status'); return true; } }
    ],

    'Update MongoDB data': [
      { name: 'findByIdAndUpdate', validate: (code) => { if (!/findByIdAndUpdate|updateOne/.test(code)) throw new Error('Missing update'); return true; } },
      { name: 'req.params.id', validate: (code) => { if (!/req\.params[\s\S]{1,50}id|req\.params\.id/.test(code)) throw new Error('Missing ID'); return true; } },
      { name: 'await update method', validate: (code) => { if (!/await\s+[\w.]+\.findByIdAndUpdate|await\s+[\w.]+\.updateOne/.test(code)) throw new Error('Missing await'); return true; } },
      { name: 'res.json(updated)', validate: (code) => { if (!/res\.json\s*\([\s\S]{1,100}\)|new:\s*true/.test(code)) throw new Error('Missing response'); return true; } }
    ],

    'Delete MongoDB data': [
      { name: 'findByIdAndDelete', validate: (code) => { if (!/findByIdAndDelete|deleteOne/.test(code)) throw new Error('Missing delete'); return true; } },
      { name: 'req.params.id', validate: (code) => { if (!/req\.params[\s\S]{1,50}id|req\.params\.id/.test(code)) throw new Error('Missing ID'); return true; } },
      { name: 'try catch block', validate: (code) => { if (!/try\s*\{[\s\S]{1,100}catch\s*\(/.test(code)) throw new Error('Missing error'); return true; } },
      { name: 'res.json(deleted)', validate: (code) => { if (!/res\.json\s*\([\s\S]{1,50}(delete|removed|success)/.test(code)) throw new Error('Missing response'); return true; } }
    ]
  };

  return testCases[taskTitle] || [
    { name: 'Code minimum length', validate: (code) => { if (!code || code.trim().length < 50) throw new Error('Code too short'); return true; } }
  ];
}

module.exports = {
  getTasksBySkill,
  getUserTasks,
  submitTask,
  createTask,
  getTaskById,
  getTasksWithProgression
};
