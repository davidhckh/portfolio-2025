import type { PaperContent } from "./types";
import type { Locale } from "../i18n/types";

export const papers = {
  en: [
    {
      title: "TreeDiff: AST-Guided Code Generation with Diffusion LLMs",
      year: "2026",
      venue: "SURGeLLM at ACL",
      status: "Accepted",
      summary:
        "Structure-aware code generation work that uses AST-guided diffs to make edits and synthesis more precise than flat text-only generation.",
      href: "https://arxiv.org/abs/2508.01473",
      featured: true,
    },
    {
      title: "RED: Adaptive Real-Time DAG Scheduling for Robotic Inference under Environmental Dynamics",
      year: "2026",
      venue: "ACM Transactions on Embedded Computing Systems",
      status: "Under review",
      summary:
        "A scheduling framework for robotic inference workloads that adapts in real time as environmental conditions and task priorities shift.",
    },
    {
      title: "Bridging the Editing Gap in LLMs: FineEdit for Precise and Targeted Text Modifications",
      year: "2025",
      venue: "Findings of EMNLP",
      status: "Published",
      summary:
        "Research on improving precision in LLM-driven editing so models can make tightly scoped changes without drifting away from the requested intent.",
      href: "https://aclanthology.org/2025.findings-emnlp.118/",
    },
    {
      title: "Infant Agent: A Tool-Integrated, Logic-Driven Agent with Cost-Effective API Usage",
      year: "2024",
      venue: "arXiv",
      status: "Preprint",
      summary:
        "An agent design focused on tool use, logical task flow, and lower-cost API orchestration without giving up practical utility.",
      href: "https://arxiv.org/abs/2411.01114",
    },
    {
      title: "RED: A Systematic Real-Time Scheduling Approach for Robotic Environmental Dynamics",
      year: "2023",
      venue: "RTSS",
      status: "Published",
      summary:
        "A real-time systems paper on scheduling strategies for robotic workloads operating under changing environmental dynamics.",
      href: "https://ieeexplore.ieee.org/abstract/document/10405986",
    },
  ],
  zh: [
    {
      title: "TreeDiff: AST-Guided Code Generation with Diffusion LLMs",
      year: "2026",
      venue: "ACL 2026 SURGeLLM Workshop",
      status: "已接收",
      summary: "用 AST 引导差分生成的结构化代码生成研究，重点是让代码编辑与生成比纯文本方法更精确、更可控。",
      href: "https://arxiv.org/abs/2508.01473",
      featured: true,
    },
    {
      title: "RED: Adaptive Real-Time DAG Scheduling for Robotic Inference under Environmental Dynamics",
      year: "2026",
      venue: "ACM Transactions on Embedded Computing Systems",
      status: "审稿中",
      summary: "面向机器人推理任务的实时 DAG 调度方法，强调在环境变化和任务优先级波动下的自适应能力。",
    },
    {
      title: "Bridging the Editing Gap in LLMs: FineEdit for Precise and Targeted Text Modifications",
      year: "2025",
      venue: "Findings of EMNLP",
      status: "已发表",
      summary: "聚焦 LLM 精准编辑能力的研究，希望模型只修改需要修改的部分，而不是对整段内容产生不必要漂移。",
      href: "https://aclanthology.org/2025.findings-emnlp.118/",
    },
    {
      title: "Infant Agent: A Tool-Integrated, Logic-Driven Agent with Cost-Effective API Usage",
      year: "2024",
      venue: "arXiv",
      status: "预印本",
      summary: "一个强调工具调用、逻辑推理流程与 API 成本控制的 Agent 框架设计。",
      href: "https://arxiv.org/abs/2411.01114",
    },
    {
      title: "RED: A Systematic Real-Time Scheduling Approach for Robotic Environmental Dynamics",
      year: "2023",
      venue: "RTSS",
      status: "已发表",
      summary: "关于机器人环境动态下实时调度策略的系统性研究，也是后续 RED 系列工作的基础。",
      href: "https://ieeexplore.ieee.org/abstract/document/10405986",
    },
  ],
} as const satisfies Record<Locale, readonly PaperContent[]>;
