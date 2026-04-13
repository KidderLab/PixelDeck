import { rebuildSearchIndex } from "@/lib/search";

rebuildSearchIndex().then(() => {
  console.log("Search index rebuilt");
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
