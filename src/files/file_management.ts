import { File } from "@ionic-native/file";

export default class FileManager {

    constructor() {
    }

    static getFileManager() {
    }

    /*
        Verifica si existe un directorio en la ruta path/dirName
        path debe finalizar con slash /
    */
    static async directoryExists(dirName, path = "") {
        const file = new File();

        let dir_exists = false;
        await file.checkDir(file.dataDirectory + path, dirName)
            .then(_ => {
                dir_exists = true;
                console.log("Directory exists: " + file.dataDirectory + path + dirName);
            })
            .catch(err => {
                console.log("Error directory not found: ", + file.dataDirectory + path + dirName,  err);
                dir_exists = false;
            })
        return dir_exists;
    }


    static async saveQuestions(filename, content, path =""){
        let current_content = await this.readFile(path, filename);
        let current_questions = await content.getAllQuestions();
        let new_content = JSON.parse(current_content);
        new_content['questions'] = current_questions;
        this.writeFile(filename, JSON.stringify(new_content), path);
    }

    /*
        Crea un archivo en la ruta path/filename y le escribe content
    */
    static async writeFile(filename, content, path = "") {
        console.log({
            filename,
            content,
            path
        });
        const file = new File();
        let file_written = false;

        await file.writeFile(file.dataDirectory + path, filename, content, {
            replace: true
        })
            .then(_ => {
                file_written = true;
                console.log("File " + file.dataDirectory + path + "/" + filename + " was written");
            })
            .catch(err => {
                console.log("Failed at writing "+file.dataDirectory + path + "/" + filename, err)
                file_written = false;
            });
        console.log("File content: "+await this.readFile(path, filename));
        return file_written;
    }

    /*
        Devuelve el contenido del archivo path/file
    */
   static async readFile(path, filename){
       const file = new File();
       let content = null;
       await file.readAsText(file.dataDirectory + path, filename)
        .then(data => {
            content = data
        })
        .catch(err => {
            console.log("Error at reading file at "+ path+ "/"+filename);
            console.log(err)
        })
        return content;
   }


    /*
        Crea un directorio si aún no existe uno en la ruta path/dirName
        path debe finalizar con slash /
    */
    static async createDirectoryIfDoesntExist(dirName, path = "") {
        const file = new File();
        let dir_created = false;
        if (await this.directoryExists(dirName, path)) {
            alert("Directory " + file.dataDirectory + path + dirName + " already exists");
            return true;
        } else {
            file.createDir(file.dataDirectory + path, dirName, false).then(
                _ => {
                    alert("Successfully created dir: " + dirName);
                    dir_created = true;
                }
            ).catch(
                err => {
                    alert("Error at creating " + dirName);
                    dir_created = false;
                }
            );
        }
        return dir_created;
    }
}