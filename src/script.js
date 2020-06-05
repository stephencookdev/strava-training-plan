const main = async () => {
  console.log(import.meta.env.SNOWPACK_PUBLIC_CLIENT_ID);

  const result = await fetch("/.netlify/functions/test");
  const jsonResult = await result.json();

  console.log(jsonResult);
};

main();
