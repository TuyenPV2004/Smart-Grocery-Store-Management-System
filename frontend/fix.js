import fs from "fs";
import path from "path";

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith(".jsx") || fullPath.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf8");

      let toastImportRegex1 = /import \{ toast \} from 'react-toastify';\n?/g;
      let toastImportRegex2 = /import \{ toast \} from "react-toastify";\n?/g;

      let hasToast = content.includes("toast.");

      let newContent = content
        .replace(toastImportRegex1, "")
        .replace(toastImportRegex2, "");

      if (hasToast) {
        newContent = "import { toast } from 'react-toastify';\n" + newContent;
      }

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, "utf8");
        console.log("Fixed imports in " + fullPath);
      }
    }
  }
}
processDir("./src");
