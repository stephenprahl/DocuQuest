import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const mockCampaigns = [
  {
    title: 'The Realm of React',
    description: 'Master the ancient art of Components and Hooks.',
    theme: 'blue',
    sourceUrl: 'https://react.dev',
    levels: [
      {
        title: 'The Component Village',
        type: 'lesson',
        xp: 100,
        order: 1,
        content: JSON.stringify({
          intro: "Welcome, traveler! In this realm, everything is a 'Component'—a reusable building block of UI.",
          text: "Components are like JavaScript functions that return UI elements. They must be capitalized!",
          snippet: "function Welcome() {\n  return <h1>Hello, World</h1>;\n}"
        })
      },
      {
        title: 'Prop Pass Mountain',
        type: 'quiz',
        xp: 150,
        order: 2,
        content: JSON.stringify({
          question: "How do you pass data from a parent component to a child?",
          options: [
            { id: 'a', text: "Using Global Variables" },
            { id: 'b', text: "Using Props" },
            { id: 'c', text: "Using Telepathy" },
            { id: 'd', text: "Using CSS" }
          ],
          correct: 'b',
          explanation: "Correct! Props (properties) are the way we pass data down the component tree."
        })
      },
      {
        title: 'The State Dungeon',
        type: 'challenge',
        xp: 300,
        order: 3,
        content: JSON.stringify({
          instruction: "The counter is broken! It's stuck at 0 because we aren't using state correctly.",
          hint: "Use useState to make the variable reactive.",
          initialCode: `function Counter() {\n  let count = 0;\n  // How do we make this persist?\n  return <button onClick={() => count++}>{count}</button>;\n}`,
          solutionKey: "useState",
          successMessage: "You've unlocked the power of State!"
        })
      },
      {
        title: 'The Hook Hydra',
        type: 'boss',
        xp: 1000,
        order: 4,
        content: JSON.stringify({
          instruction: "BOSS BATTLE: The Hydra has two heads! You must manage two separate states AND an effect.",
          hint: "Declare two useState variables and one useEffect.",
          initialCode: `function HydraBattle() {\n  // Head 1: Health\n  // Head 2: Energy\n  \n  // Effect: Regenerate when low\n  \n  return <div>Fighting...</div>;\n}`,
          solutionKey: ["useState", "useState", "useEffect"],
          successMessage: "LEGENDARY! You have tamed the Hook Hydra!"
        })
      }
    ]
  },
  {
    title: 'Python Pyramids',
    description: 'Navigate the serpentine paths of indentation and lists.',
    theme: 'yellow',
    sourceUrl: 'https://docs.python.org',
    levels: [
      {
        title: 'Indentation Gate',
        type: 'lesson',
        xp: 100,
        order: 1,
        content: JSON.stringify({
          intro: "Halt! In Python, whitespace is law.",
          text: "Unlike other languages that use curly braces {}, Python uses indentation to define code blocks.",
          snippet: "if True:\n    print('This is inside')\nprint('This is outside')"
        })
      },
      {
        title: 'List Lake',
        type: 'challenge',
        xp: 250,
        order: 2,
        content: JSON.stringify({
          instruction: "Create a list of numbers named 'scores'.",
          hint: "Lists use square brackets [].",
          initialCode: `# Create a list called scores with values 1, 2, 3\n\n`,
          solutionKey: ["scores = ["],
          successMessage: "Excellent! The list is formed."
        })
      }
    ]
  }
]

async function seed() {
  console.log('🌱 Starting database seed...')

  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'dev@docuquest.com' },
    update: {},
    create: {
      email: 'dev@docuquest.com',
      username: 'DevAdventurer',
      level: 1,
      xp: 0
    }
  })

  console.log('✅ Created user:', user.username)

  // Create campaigns
  for (const campaignData of mockCampaigns) {
    const { levels, ...campaignInfo } = campaignData
    
    const campaign = await prisma.campaign.create({
      data: {
        ...campaignInfo,
        createdBy: user.id,
        levels: {
          create: levels
        }
      },
      include: {
        levels: true
      }
    })

    console.log(`✅ Created campaign: ${campaign.title} with ${campaign.levels.length} levels`)
  }

  console.log('🎉 Database seeded successfully!')
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
