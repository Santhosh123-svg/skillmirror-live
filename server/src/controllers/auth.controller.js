const User = require('../models/User');
const Skill = require('../models/Skill');
const Task = require('../models/Task');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    
    console.log('📝 Register attempt:', { name, email, password: '***' });
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password here
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('✅ Password hashed successfully');

    const user = new User({ 
      name, 
      email, 
      password: hashedPassword
    });
    await user.save();
    
    console.log('✅ User saved to DB:', user._id);

    // 5 tasks for each skill
    const skillTaskMap = {
      'HTML & CSS Basics': [
        {
          title: 'Create a responsive navigation bar',
          description: 'Build a navbar with logo, menu items, and mobile hamburger menu using HTML/CSS flexbox.'
        },
        {
          title: 'Design a professional landing page',
          description: 'Create a landing page with header, hero section, features, testimonials, and footer using HTML/CSS.'
        },
        {
          title: 'Build a responsive card layout',
          description: 'Design a card grid layout that adapts to different screen sizes using CSS Grid and media queries.'
        },
        {
          title: 'Create a form with validation styles',
          description: 'Build an HTML form with CSS styling for inputs, labels, error messages, and success states.'
        },
        {
          title: 'Design a footer with multiple sections',
          description: 'Create a footer with company info, links, social media, and newsletter signup using semantic HTML.'
        }
      ],
      'JavaScript Fundamentals': [
        {
          title: 'Build a todo list application',
          description: 'Create a todo app with add, delete, edit, and mark complete functionality using vanilla JavaScript.'
        },
        {
          title: 'Create a calculator with basic operations',
          description: 'Build a working calculator with +, -, *, / operations, decimal support, and clear functionality.'
        },
        {
          title: 'Implement a search filter for items',
          description: 'Create a dynamic search filter that instantly updates a list based on user input using DOM manipulation.'
        },
        {
          title: 'Build a stopwatch/timer application',
          description: 'Create a stopwatch with start, stop, reset buttons and lap functionality using JavaScript timers.'
        },
        {
          title: 'Create a quote generator app',
          description: 'Build an app that displays random quotes and allows users to copy or share them using APIs.'
        }
      ],
      'React Basics': [
        {
          title: 'Build a counter component',
          description: 'Create a React component with increment, decrement, and reset buttons using useState hook.'
        },
        {
          title: 'Create a weather app component',
          description: 'Build a React component that fetches and displays weather data using OpenWeather API and useEffect.'
        },
        {
          title: 'Build a todo list with React',
          description: 'Create a functional todo component with add, delete features using React hooks and state management.'
        },
        {
          title: 'Create a user profile component',
          description: 'Build a profile component that displays user info, allows editing, and saves changes using state.'
        },
        {
          title: 'Implement a product filtering app',
          description: 'Create a React app with product list, price filter, and category filter using hooks and props.'
        }
      ],
      'Node.js Backend': [
        {
          title: 'Create a REST API with Express',
          description: 'Build a simple REST API with GET, POST, PUT, DELETE endpoints for a resource using Express.js.'
        },
        {
          title: 'Implement authentication system',
          description: 'Create login/register endpoints with JWT token authentication and password hashing using bcrypt.'
        },
        {
          title: 'Build file upload functionality',
          description: 'Implement file upload feature using multer middleware, handle validation, and store files securely.'
        },
        {
          title: 'Create error handling middleware',
          description: 'Build custom error handling middleware with proper HTTP status codes and error messages.'
        },
        {
          title: 'Implement pagination and filtering',
          description: 'Create API endpoints that support pagination, sorting, and filtering for large datasets.'
        }
      ],
      'MongoDB Database': [
        {
          title: 'Design a database schema',
          description: 'Create MongoDB collections for an e-commerce app with users, products, orders, and reviews.'
        },
        {
          title: 'Write CRUD operations',
          description: 'Implement Create, Read, Update, Delete operations for a product inventory management system.'
        },
        {
          title: 'Create database relationships',
          description: 'Build relationships between collections using references and implement population for nested data.'
        },
        {
          title: 'Implement indexing and optimization',
          description: 'Create indexes on frequently queried fields and optimize database queries for performance.'
        },
        {
          title: 'Build data validation with schemas',
          description: 'Create Mongoose schemas with validators, default values, and custom validation methods.'
        }
      ]
    };

    const skills = await Skill.find();
    
    if (skills.length > 0) {
      for (let skill of skills) {
        const existingTasks = await Task.findOne({ 
          userId: user._id, 
          skillId: skill._id 
        });

        if (!existingTasks) {
          const taskTemplate = skillTaskMap[skill.name] || [
            {
              title: `Task 1: ${skill.name}`,
              description: `Complete your first ${skill.name} assignment`
            },
            {
              title: `Task 2: ${skill.name}`,
              description: `Complete your second ${skill.name} assignment`
            },
            {
              title: `Task 3: ${skill.name}`,
              description: `Complete your third ${skill.name} assignment`
            },
            {
              title: `Task 4: ${skill.name}`,
              description: `Complete your fourth ${skill.name} assignment`
            },
            {
              title: `Task 5: ${skill.name}`,
              description: `Complete your fifth ${skill.name} assignment`
            }
          ];

          const tasksToCreate = taskTemplate.map((t) => ({
            skillId: skill._id,
            userId: user._id,
            title: t.title,
            description: t.description,
            status: 'pending',
            submissionDate: null,
            createdAt: new Date()
          }));

          await Task.create(tasksToCreate);
          console.log(`✅ 5 Tasks created for skill: ${skill.name}`);
        } else {
          console.log(`⏭️  Tasks already exist for skill: ${skill.name}, skipping...`);
        }
      }
      console.log('✅ Task creation process completed');
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Login attempt with email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    console.log('👤 User found in DB:', user ? 'YES ✅' : 'NO ❌');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('🔑 Comparing passwords...');
    const isMatch = await user.comparePassword(password);
    console.log('🔑 Password match result:', isMatch ? 'MATCH ✅' : 'NO MATCH ❌');
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✅ Authentication successful! Generating token...');
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = { register, login };
