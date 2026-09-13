import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

class EngineeringCounsel {
  constructor(
    public name: string,
    public discipline: string,
    public systemPrompt: string,
    public type: 'claude' | 'gemini'
  ) {}

  async ask(userMessage: string, history: any[] = []): Promise<string> {
    if (this.type === 'claude') {
      const messages = [
        ...history,
        { role: 'user' as const, content: userMessage },
      ];

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1200,
        system: this.systemPrompt,
        messages,
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } else {
      const model = gemini.getGenerativeModel({
        model: 'gemini-3.6-flash',
        systemInstruction: this.systemPrompt,
      });

      const geminiHistory = history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      geminiHistory.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      const response = await model.generateContent({
        contents: geminiHistory,
      });

      return response.response.text();
    }
  }
}

const boardMembers = {
  proposer: new EngineeringCounsel(
    'Chief Engineer',
    'Systems & Architecture',
    `You are a Chief Systems Engineer at a top-tier company.
     Propose a clear, confident recommendation. Start with "RECOMMENDATION:"
     NO hedging. Be specific about trade-offs and risks accepted.`,
    'claude'
  ),
  manufacturing: new EngineeringCounsel(
    'Manufacturing Engineer',
    'Manufacturing & Producibility',
    `You are a Manufacturing Engineer. Identify DFM risks, yield issues, supply chain problems.
     Format: List 4-5 SPECIFIC risks. Start with "MANUFACTURING RISKS:"`,
    'gemini'
  ),
  electrical: new EngineeringCounsel(
    'Electrical Engineer',
    'Electrical & Power Systems',
    `You are an Electrical Engineer. Identify power, signal integrity, thermal risks.
     Format: List 4-5 SPECIFIC risks with numbers. Start with "ELECTRICAL RISKS:"`,
    'claude'
  ),
  mechanical: new EngineeringCounsel(
    'Mechanical Engineer',
    'Mechanical Design & Structure',
    `You are a Mechanical Engineer. Identify stress, tolerance, thermal expansion risks.
     Format: List 4-5 SPECIFIC risks. Start with "MECHANICAL RISKS:"`,
    'gemini'
  ),
  firmware: new EngineeringCounsel(
    'Firmware Engineer',
    'Firmware & Embedded Systems',
    `You are a Firmware Engineer. Identify latency, memory, concurrency risks.
     Format: List 4-5 SPECIFIC risks with cycle counts. Start with "FIRMWARE RISKS:"`,
    'claude'
  ),
  reliability: new EngineeringCounsel(
    'Reliability Engineer',
    'Reliability & Quality',
    `You are a Reliability Engineer. Identify failure modes, test gaps, warranty risks.
     Format: List 4-5 SPECIFIC risks. Start with "RELIABILITY RISKS:"`,
    'gemini'
  ),
};

export async function POST(request: Request) {
  try {
    const { problem } = await request.json();

    const proposal = await boardMembers.proposer.ask(problem);

    const reviews = [];
    for (const [key, member] of Object.entries(boardMembers)) {
      if (key === 'proposer') continue;

      const review = await member.ask(
        `Design problem:\n${problem}\n\nProposed solution:\n${proposal}\n\nReview this proposal from your discipline's perspective.`
      );

      reviews.push({
        engineer: member.name,
        discipline: member.discipline,
        review,
      });
    }

    const reviewSummary = reviews
      .map((r) => `${r.engineer} (${r.discipline}):\n${r.review}`)
      .join('\n\n');

    const synthesis = await boardMembers.proposer.ask(
      `Here is your original proposal:\n${proposal}\n\nHere is feedback from the engineering review board:\n\n${reviewSummary}\n\nSynthesize this feedback into a final recommendation. Address the most critical risks raised and state clearly whether the proposal should proceed as-is, be revised, or be rejected.`
    );

    return NextResponse.json({ proposal, reviews, synthesis });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}