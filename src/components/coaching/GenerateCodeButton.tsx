
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';

const GenerateCodeButton = () => {
  const { generateConnectionCode, connectionCode, disableConnectionCode, loading } = useCoachStudent();

  return (
    <div className="flex flex-col items-center gap-2">
      {connectionCode ? (
        <Button 
          onClick={disableConnectionCode}
          variant="destructive"
          className="w-full h-7 text-xs px-2.5"
          disabled={loading}
        >
          {loading ? (
            <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icon name="X" className="mr-2 h-4 w-4" />
          )}
          Disable Connection Code
        </Button>
      ) : (
        <Button 
          onClick={generateConnectionCode}
          variant="poker"
          className="w-full h-7 text-xs px-2.5"
          disabled={loading}
        >
          {loading ? (
            <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icon name="Plus" className="mr-2 h-4 w-4" />
          )}
          Generate Connection Code
        </Button>
      )}
    </div>
  );
};

export default GenerateCodeButton;
