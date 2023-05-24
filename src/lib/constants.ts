import * as process from "process";


// Load DB path for current environment
export const getDbPath = (): string => {
  if (!process.env.DB_PATH) {
    throw new Error("No path to Database found");
  }

  return process.env.DB_PATH;
};
