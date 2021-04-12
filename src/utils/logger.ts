export const log = (msg?: any, ...args: any[]) => {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  console.log(msg, ...args);
};
