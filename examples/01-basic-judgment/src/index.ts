import { JudgmentEngine } from '@reaatech/llm-judge-engine';
import { LocalProvider } from '@reaatech/llm-judge-providers';
import type { TemplateContext } from '@reaatech/llm-judge-templates';
import { FaithfulnessTemplate } from '@reaatech/llm-judge-templates';

async function main() {
  const provider = new LocalProvider();
  const template = new FaithfulnessTemplate();
  const engine = new JudgmentEngine({
    provider,
    template,
    config: { model: 'llama3.2' },
  });

  const context: TemplateContext = {
    query: 'What are black holes?',
    response:
      'A black hole is a region of spacetime where gravity is so strong that nothing, not even light, can escape. They form when massive stars collapse at the end of their lifecycle.',
    context:
      'Black holes are regions of spacetime exhibiting gravitational acceleration so strong that nothing—no particles or even electromagnetic radiation such as light—can escape from it. The theory of general relativity predicts that a sufficiently compact mass can deform spacetime to form a black hole.',
  };

  const judgment = await engine.judge(context);

  console.log(
    JSON.stringify(
      {
        id: judgment.id,
        criteria: judgment.criteria,
        score: judgment.score,
        reasoning: judgment.reasoning,
        confidence: judgment.confidence,
        cost: judgment.cost,
        provider: judgment.provider,
        model: judgment.model,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('Judgment failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
