import { useState } from 'react';

const useForm = (
  callback: () => Promise<void> | void,
  initState: Record<string, string>
) => {
  const [inputs, setInputs] = useState(initState);

  const handleSubmit = async () => {
    await callback(); // Just call it, no synthetic event
  };

  const handleInputChange = (name: string, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return {
    handleSubmit,
    handleInputChange,
    inputs,
    setInputs,
  };
};

export { useForm };
