import type {Request, Response} from 'express'
import { prisma } from '../../prisma/db';
import openai from '../../configs/openai';


export const getUserCredits = async (req:Request, res:Response) =>{
  const userId = req.userId;
  if(!userId){
    return res.status(401).json({message: "Unauthorized"})
  }
  try {
    const user = await prisma.user.findUnique({
      where: {id: userId }
    })

    res.status(200).json({credits: user?.credits})
  } catch (error:any) {
    res.status(500).json({message: error.message})
  }
}


export const createUserProject = async (req:Request, res:Response) =>{
  const userId = req.userId;
  try {
    const {initial_prompt} = req.body;

    if(!userId){
      return res.status(401).json({message: "Unauthorized"})
    }

    const user = await prisma.user.findUnique({
      where: {id: userId }
    })

    if(user && user.credits < 5){
      return res.status(401).json({message: "You don't have enough credits  to create new project"});
    }

    const project = await prisma.websiteProject.create({
      data: {
        name: initial_prompt.length > 50 ? initial_prompt.substring(0, 47) + '...' : initial_prompt,
        initial_prompt,
        current_version: '',
        isPublished: false,
        userId
      }
    });
    //update total creatiions
    await prisma.user.update({
      where: {id: userId},
      data: {
        totalCreation: { increment: 1}
      }
    });

    await prisma.conversation.create({
      data: {
        role: 'user',
        content: initial_prompt,
        projectId: project.id
      }
    });

    await prisma.user.update({
      where: {id: userId},
      data:{
        credits: { decrement: 5 }
      }
    });

    res.json({projectId: project.id})

    //Enhance user prompt
    const enhancedUserPrompt = await openai.chat.completions.create({
      model: 'kwaipilot/kat-coder-pro:free',
        messages: [
            {
                role: 'system',
                content: `
                You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.

                Enhance this prompt by:
                1. Adding specific design details (layout, color scheme, typography)
                2. Specifying key sections and features
                3. Describing the user experience and interactions
                4. Including modern web design best practices
                5. Mentioning responsive design requirements
                6. Adding any missing but important elements

                Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).`
            },
            {
                role: 'user',
                content: initial_prompt
            }
        ]
    });

    const enhancedPrompt = enhancedUserPrompt.choices[0]?.message.content;

    await prisma.conversation.create({
      data:{
        role: 'assistant',
        content: `I've changed your prmpt to: ${enhancedPrompt}`,
        projectId: project.id
      }
    });

    const codeGenerationResponse = await openai.chat.completions.create({
        model: 'kwaipilot/kat-coder-pro:free',
        messages: [
            {
              role: 'system',
                content: `
                You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}"

              CRITICAL REQUIREMENTS:
              - You MUST output valid HTML ONLY. 
              - Use Tailwind CSS for ALL styling
              - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
              - Use Tailwind utility classes extensively for styling, animations, and responsiveness
              - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
              - Use modern, beautiful design with great UX using Tailwind classes
              - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
              - Use Tailwind animations and transitions (animate-*, transition-*)
              - Include all necessary meta tags
              - Use Google Fonts CDN if needed for custom fonts
              - Use placeholder images from https://placehold.co/600x400
              - Use Tailwind gradient classes for beautiful backgrounds
              - Make sure all buttons, cards, and components use Tailwind styling

              CRITICAL HARD RULES:
              1. You MUST put ALL output ONLY into message.content.
              2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
              3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
              4. Do NOT include markdown, explanations, notes, or code fences.

              The HTML should be complete and ready to render as-is with Tailwind CSS.`
            },
            {
              role: 'user',
              content: enhancedPrompt || ''
            }
        ]
    });

    const code = codeGenerationResponse.choices[0]?.message.content || ' ';

    if(!code){
      await prisma.conversation.create({
        data:{
          role: 'assistant',
          content: "Unable to generate code, please try again",
          projectId: project.id
        }
      });
      await prisma.user.update({
        where: {id: userId},
        data: {
          credits: {increment: 5}
        }
      });
      return;
    }

    const version = await prisma.version.create({
        data: {
          code: code.replace(/```[a-z]*\n?/gi, '')
          .replace(/```$/g, '')
          .trim(),
          description: 'Initial version',
          projectId: project.id
        }
      });

      await prisma.conversation.create({
        data: {
          role: 'assistant',
          content: "I've created your website! You can now preview it and request any changes.",
          projectId: project.id
        }
      });

      await prisma.websiteProject.update({
          where: {id: project.id},
          data: {
            current_code: code.replace(/```[a-z]*\n?/gi, '')
            .replace(/```$/g, '')
            .trim(),
            current_version_index: version.id
          }
        })
        
  } catch (error:any) {
    await prisma.user.update({
          where: {id: userId},
          data: {credits: {increment: 5}}
        })
      console.log(error);
      res.status(500).json({ message: error.message });
    }
}


export const getUserProject = async (req:Request, res:Response) =>{
  try {
    const userId = req.userId
    const { projectId } = req.params;
    if(!userId){
      return res.status(401).json({message: "Unauthorized"});
    }
    if (!projectId || Array.isArray(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const userProject = await prisma.websiteProject.findUnique({
      where: { id: projectId, userId },
      include: {
        conversations: {
          orderBy: {timestamp: 'asc'}
        },
        version: {orderBy: {timestamp: 'asc' }}
      }
    })

    res.status(200).json({Project: userProject})
  } catch (error:any) {
    res.status(500).json({message: error.message})
  }
}

export const userProjects = async (req:Request, res:Response) =>{
  try {
    const userId = req.userId;
    if(!userId){
      return res.status(401).json({message: "Unauthorized"})
    }

    const userProjects = await prisma.websiteProject.findMany({
      where: {userId},
      orderBy: {updatedAt:'asc'}
    });

    res.json(200).json({UserProjects: userProjects})
  } catch (error:any) {
    res.status(500).json({message: error.message})
  }
}


export const togglePulished = async (req:Request, res:Response) =>{
  try {
    const userId = req.userId;
    const { projectId } = req.params;
    if(!userId){
      return res.status(401).json({message: "Unauthorized"})
    }
    if (!projectId || Array.isArray(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const project = await prisma.websiteProject.findUnique({
        where: {id: projectId, userId}
      })

      if(!project){
          return res.status(404).json({ message: 'Project not found' });
      }

    const togglePulishe = await prisma.websiteProject.update({
      where: { id: projectId },
      data: {
        isPublished: !project.isPublished
      }
    });

    res.json({message: project.isPublished ? 'Project Unpublished' : 'Project Published Successfully'})

  } catch (error:any) {
    res.status(500).json({message: error.message})
  }
}

export const purchaseCredits = async (req: Request, res: Response) => {
    // try {
    //     interface Plan {
    //         credits: number;
    //         amount: number;
    //     }

    //     const plans = {
    //         basic: {credits: 100, amount: 5},
    //         pro: {credits: 400, amount: 19},
    //         enterprise: {credits: 1000, amount: 49},
    //     }

    //     const userId = req.userId;
    //     const {planId} = req.body as {planId: keyof typeof plans}
    //     const origin = req.headers.origin as string;

    //     const plan: Plan = plans[planId]

    //     if(!plan){
    //         return res.status(404).json({ message: 'Plan not found' });
    //     }

    //     const transaction = await prisma.transaction.create({
    //         data: {
    //             userId: userId!,
    //             planId: req.body.planId,
    //             amount: plan.amount,
    //             credits: plan.credits
    //         }
    //     })

    //     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    //     const session = await stripe.checkout.sessions.create({
    //             success_url: `${origin}/loading`,
    //             cancel_url: `${origin}`,
    //             line_items: [
    //                 {
    //                 price_data: {
    //                     currency: 'usd',
    //                     product_data: {
    //                         name: `AiSiteBuilder - ${plan.credits} credits`
    //                     },
    //                     unit_amount: Math.floor(transaction.amount) * 100
    //                 },
    //                 quantity: 1
    //                 },
    //             ],
    //             mode: 'payment',
    //             metadata: {
    //                 transactionId: transaction.id,
    //                 appId: 'ai-site-builder'
    //             },
    //             expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
    //             });

    //     res.json({payment_link: session.url})

    // } catch (error: any) {
    //     console.log(error.code || error.message);
    //     res.status(500).json({ message: error.message });
    // }
}