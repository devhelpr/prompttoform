import React, { useMemo, useEffect, useRef } from "react";
import mermaid from "mermaid";

interface BranchCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

interface Branch {
  condition: BranchCondition;
  nextPage: string;
}

interface Page {
  id: string;
  title: string;
  route: string;
  components: Array<{
    id: string;
    type: string;
    label?: string;
    visibilityConditions?: Array<BranchCondition>;
  }>;
  nextPage?: string;
  branches?: Branch[];
  isEndPage?: boolean;
}

interface FormFlowMermaidProps {
  formJson: {
    app: {
      pages: Page[];
    };
  };
}

const FormFlowMermaid: React.FC<FormFlowMermaidProps> = ({ formJson }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: "basis",
      },
    });
  }, []);

  const mermaidDiagram = useMemo(() => {
    const pages = formJson.app.pages;
    let diagram = "graph TD\n";

    // Add nodes
    pages.forEach((page) => {
      const nodeId = page.id.replace(/[^a-zA-Z0-9]/g, "_");
      diagram += `    ${nodeId}["${page.title}"]\n`;
    });

    // Add edges
    pages.forEach((page) => {
      const sourceId = page.id.replace(/[^a-zA-Z0-9]/g, "_");

      // Add default next page edge
      if (page.nextPage) {
        const targetId = page.nextPage.replace(/[^a-zA-Z0-9]/g, "_");
        diagram += `    ${sourceId} --> ${targetId}\n`;
      }

      // Add branch edges
      if (page.branches) {
        page.branches.forEach((branch) => {
          const targetId = branch.nextPage.replace(/[^a-zA-Z0-9]/g, "_");
          const condition = `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value}`;
          diagram += `    ${sourceId} -->|${condition}| ${targetId}\n`;
        });
      }
    });

    return diagram;
  }, [formJson]);

  useEffect(() => {
    async function renderMermaid() {
      if (mermaidRef.current) {
        try {
          const { svg, bindFunctions } = await mermaid.render(
            `mermaid-diagram-${idRef.current}`,
            mermaidDiagram,
            mermaidRef.current
          );
          mermaidRef.current.innerHTML = svg;
          bindFunctions?.(mermaidRef.current);
        } catch (e) {
          console.log("error", e);
        }
      }
    }
    renderMermaid();
  }, [idRef, mermaidDiagram]);

  return (
    <div className="w-full h-[600px] overflow-auto bg-white p-4 rounded-lg border border-zinc-300">
      <div ref={mermaidRef} />
    </div>
  );
};

export default FormFlowMermaid;
