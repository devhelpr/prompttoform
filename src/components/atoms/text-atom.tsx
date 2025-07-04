import React from "react";

interface TextAtomProps {
  label?: string;
  props?: {
    content?: string;
    text?: string;
    helperText?: string;
  };
}

export const TextAtom: React.FC<TextAtomProps> = ({ label, props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {typeof props?.content === "string" && (
        <p className="text-gray-700">{props.content}</p>
      )}
      {typeof props?.text === "string" && (
        <p className="text-gray-700">{props.text}</p>
      )}
      {typeof props?.helperText === "string" && (
        <p className="text-gray-700">{props.helperText}</p>
      )}
    </div>
  );
};
