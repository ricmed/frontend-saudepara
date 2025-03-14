import React from "react";

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({
  icon,
  title,
}) => (
  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
    {icon}
    <span>{title}</span>
  </h2>
);

export default SectionTitle;