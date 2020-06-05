const main = async () => {
  const result = await fetch("/.netlify/functions/test");
  const jsonResult = await result.json();

  console.log(jsonResult);
};

main();
