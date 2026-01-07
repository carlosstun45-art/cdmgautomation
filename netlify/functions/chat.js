import OpenAI from "openai";
export default async (request) => {
  try{
    if(request.method !== "POST") return new Response(JSON.stringify({error:"Method not allowed"}),{status:405});
    const {message} = await request.json();
    if(!message || typeof message !== "string") return new Response(JSON.stringify({error:"Missing message"}),{status:400});
    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) return new Response(JSON.stringify({error:"OPENAI_API_KEY not set"}),{status:500});
    const client = new OpenAI({ apiKey });
    const resp = await client.responses.create({
      model:"gpt-5.2-mini",
      instructions:"You are a concise website assistant for CDMG Automation. Reply in the user's language (EN/ES/FR/NL). Explain services and onboarding briefly.",
      input: message
    });
    return new Response(JSON.stringify({reply: resp.output_text}),{headers:{"Content-Type":"application/json"},status:200});
  }catch(err){
    return new Response(JSON.stringify({error:String(err?.message||err)}),{headers:{"Content-Type":"application/json"},status:500});
  }
};
