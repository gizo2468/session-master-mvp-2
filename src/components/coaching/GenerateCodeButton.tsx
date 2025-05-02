
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';

const GenerateCodeButton = () => {
  const { generateConnectionCode, connectionCode, disableConnectionCode } = useCoachStudent();

  return (
    <div className="flex flex-col items-center gap-2">
      {connectionCode ? (
        <Button 
          onClick={disableConnectionCode}
          variant="destructive"
          className="w-full h-8 text-sm px-3"
        >
          Disable Connection Code
        </Button>
      ) : (
        <Button 
          onClick={generateConnectionCode}
          variant="poker"
          className="w-full h-8 text-sm px-3"
        >
          Generate Connection Code
        </Button>
      )}
    </div>
  );
};

export default GenerateCodeButton;
