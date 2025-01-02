// for testing purposes
export const loadStrykerConfig = async (strykerConfigPath: string) => {
  console.log('strykerConfigPath', strykerConfigPath);
  return await import(strykerConfigPath);
};
