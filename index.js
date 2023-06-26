const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const os = require("os");
const readline = require("readline");
const { createHash } = require("crypto");

const username = process.argv[2].split("=")[1];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${username}> `,
});

let currentDirectory = process.cwd();

console.log(`Welcome to the File Manager, ${username}!\n`);

console.log(`You are currently in ${currentDirectory}\n`);

rl.prompt();

rl.on("line", (line) => {
  const [command, ...args] = line.trim().split(" ");

  switch (command) {
    case "up":
      navigateUpHandler();
      break;
    case "cd":
      navigateToDirectoryHandler(args[0]);
      break;
    case "ls":
      listFilesHandler();
      break;
    case "cat":
      readFileHandler(args[0]);
      break;
    case "add":
      addFileHandler(args[0]);
      break;
    case "rn":
      renameFileHandler(args[0], args[1]);
      break;
    case "cp":
      copyFileHandler(args[0], args[1]);
      break;
    case "mv":
      moveFileHandler(args[0], args[1]);
      break;
    case "rm":
      deleteFileHandler(args[0]);
      break;
    case "os":
      operatingSystemsHandler(args);
      break;
    case "hash":
      calculateHashFileHandler(args[0]);
      break;
    case "compress":
      compressFile(args[0], args[1]);
      break;
    case "decompress":
      decompressFile(args[0], args[1]);
    default:
      console.log("Invalid command");
      break;
  }

  rl.prompt();
}).on("close", () => {
  console.log(`Thank you for using File Manager, ${username}, goodbye!`);
});

// function for up command
function navigateUpHandler() {
  const parentDirectory = path.dirname(currentDirectory);

  if (currentDirectory !== parentDirectory) {
    currentDirectory = parentDirectory;
    console.log(`You are currently in ${currentDirectory}`);
  } else {
    console.log("Cannot go higher than the root directory");
  }
}

// function for cd command
function navigateToDirectoryHandler(directory) {
  const newDirectory = path.isAbsolute(directory)
    ? directory
    : path.join(currentDirectory, directory);
  if (fs.existsSync(newDirectory)) {
    currentDirectory = newDirectory;
    console.log(`You are currently in ${currentDirectory}`);
  } else {
    console.log("Invalid input");
  }
}

// function for ls command
function listFilesHandler() {
  const files = fs.readdirSync(currentDirectory);

  files.sort((a, b) => {
    const staticsA = fs.statSync(path.join(currentDirectory, a));
    const staticsB = fs.statSync(path.join(currentDirectory, b));

    if (staticsA.isDirectory() && !staticsB.isDirectory()) {
      return -1;
    } else if (!staticsA.isDirectory() && staticsB.isDirectory) {
      return 1;
    } else {
      return 0;
    }
  });

  let result = [];
  files.forEach((file, index) => {
    const filePath = path.join(currentDirectory, file);
    const fileStatic = fs.statSync(filePath);
    const type = fileStatic.isDirectory() ? "Folder" : "File";
    result.push({ name: file, type: type });
  });
  console.table(result);
}

// function for cat command
function readFileHandler(file) {
  const filePath = path.isAbsolute(file)
    ? file
    : path.join(currentDirectory, file);

  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    const readableStream = fs.createReadStream(filePath);
    const promise = new Promise((resolve, reject) => {
      readableStream.on("data", (chunk) => {
        let data = "";
        data += chunk;
        resolve(data);
      });
    });
    console.log(promise.then((data) => console.log(data)));
  } else {
    console.log("Invalid input");
  }
}

// function for add command
function addFileHandler(file) {
  const filePath = path.join(currentDirectory, file);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");

    console.log("file added successfully" + filePath);
  } else {
    console.log("File already exists");
  }
}

// function for rename command
function renameFileHandler(oldName, newName) {
  const oldPath = path.join(currentDirectory, oldName);
  const newPath = path.join(currentDirectory, newName);

  if (fs.existsSync(oldPath) && fs.lstatSync(oldPath).isFile()) {
    fs.renameSync(oldPath, newPath);

    console.log("file renamed successfully" + oldPath);
  } else {
    console.log("Invalid input");
  }
}

// function for copy command
function copyFileHandler(source, destination) {
  const sourcePath = path.isAbsolute(source)
    ? source
    : path.join(currentDirectory, source);

  const destinationPath = path.isAbsolute(destination)
    ? destination
    : path.join(currentDirectory, destination);

  if (fs.existsSync(sourcePath) && fs.lstatSync(sourcePath).isFile()) {
    const read = fs.createReadStream(sourcePath);
    const promise = new Promise((resolve, reject) => {
      read.on("data", (chunk) => {
        let data = "";
        data += chunk;
        resolve(data);
      });
    });

    const write = fs.createWriteStream(destinationPath);
    promise.then((data) => {
      console.log("copied successfully");
      write.write(data);
      write.end();
    });
  }
}

// function for move command
function moveFileHandler(source, destination) {
  const sourcePath = path.isAbsolute(source)
    ? source
    : path.join(currentDirectory, source);

  const destinationPath = path.isAbsolute(destination)
    ? destination
    : path.join(currentDirectory, destination);

  if (fs.existsSync(sourcePath) && fs.lstatSync(sourcePath).isFile()) {
    if (
      !fs.existsSync(destinationPath) ||
      fs.lstatSync(destinationPath).isDirectory()
    ) {
      const read = fs.createReadStream(sourcePath);
      const write = fs.createWriteStream(destinationPath);

      read.pipe(write);

      read.on("end", () => {
        fs.unlinkSync(sourcePath);
        console.log(`Moved file ${source} to ${destination}`);
      });
    } else {
      console.log("Invalid input");
    }
  } else {
    console.log("Invalid input");
  }
}

function deleteFileHandler(file) {
  const filePath = path.isAbsolute(file)
    ? file
    : path.join(currentDirectory, file);

  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    fs.unlinkSync(filePath);

    console.log("file deleted successfully" + filePath);
  } else {
    console.log("Invalid input");
  }
}

// function form operating system commands
function operatingSystemsHandler(args) {
  const option = args[0];

  switch (option) {
    case "--EOL":
      console.log(os.EOL);
      break;
    case "--cpus":
      const cpus = os.cpus();
      console.log(`CPUs: ${cpus.length}`);
      cpus.forEach((cpu, index) => {
        console.log(`CPU ${index + 1}: ${cpu.model} (${cpu.speed} GHz)`);
      });
      break;
    case "--homedir":
      console.log(os.homedir());
      break;
    case "--username":
      console.log(os.userInfo().username);
      break;
    case "--architecture":
      console.log(process.arch);
      break;
    default:
      console.log("Invalid input");
      break;
  }
}

//function for hash command
function calculateHashFileHandler(file) {
  const filePath = path.isAbsolute(file)
    ? file
    : path.join(currentDirectory, file);

  fs.readFile(filePath, (err, data) => {
    if (err) throw new Error(err);
    console.log(createHash("sha256").update(data.toString()).digest("hex"));
  });
}

// compress the file
function compressFile(file, destination) {
  const filePath = path.isAbsolute(file)
    ? file
    : path.join(currentDirectory, file);
  const destinationPath = path.isAbsolute(destination)
    ? destination
    : path.join(currentDirectory, destination);

  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    if (!fs.existsSync(destinationPath)) {
      const readableStream = fs.createReadStream(filePath);
      const writableStream = fs.createWriteStream(destinationPath);
      const compressStream = zlib.createBrotliCompress();

      readableStream.pipe(compressStream).pipe(writableStream);

      writableStream.on("finish", () => {
        console.log(`Compressed file ${file} to ${destination}`);
      });
    } else {
      console.log("Invalid input");
    }
  } else {
    console.log("Invalid input");
  }
}

// decompress
function decompressFile(file, destination) {
  const filePath = path.isAbsolute(file)
    ? file
    : path.join(currentDirectory, file);
  const destinationPath = path.isAbsolute(destination)
    ? destination
    : path.join(currentDirectory, destination);

  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    if (!fs.existsSync(destinationPath)) {
      const readableStream = fs.createReadStream(filePath);
      const writableStream = fs.createWriteStream(destinationPath);
      const decompressStream = zlib.createBrotliDecompress();

      readableStream.pipe(decompressStream).pipe(writableStream);

      writableStream.on("finish", () => {
        console.log(`Decompressed file ${file} to ${destination}`);
      });
    } else {
      console.log("Invalid input");
    }
  } else {
    console.log("Invalid input");
  }
}
