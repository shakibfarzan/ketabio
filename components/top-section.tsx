import React from 'react';

type Props = {
  title: string;
  rightComponent?: React.ReactNode;
};

const TopSection: React.FC<Props> = ({ rightComponent, title }) => {
  return (
    <div className="w-full flex justify-between items-center px-12 py-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {rightComponent}
    </div>
  );
};

export default TopSection;
