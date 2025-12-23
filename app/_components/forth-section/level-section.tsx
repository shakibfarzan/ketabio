import React from 'react';

type Props = {
  level: number;
  title: string;
  description: string;
};

const LevelSection: React.FC<Props> = ({ level, description, title }) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-full w-16 h-16 flex items-center justify-center bg-primary text-background p-4 text-2xl shadow-xl">
        {level}
      </div>
      <h5 className="text-lg text-center font-semibold">{title}</h5>
      <p className="text-muted-foreground text-sm text-center">{description}</p>
    </div>
  );
};

export default LevelSection;
