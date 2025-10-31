import MapStocOtim from "./models/MapStocOtim";
import HttpResponse from "./models/HttpResponse";
import User from "./models/User";
// import {getEnvVariables} from "./utility/envUtils";
// asta era  import {globalConfig, loadConfig} from './config/configLoader';
// let env = getEnvVariables();
import {AppConfig} from "./models/AppConfig";
import {loadConfig} from "./utile/utile";

export default class Api{

   async api<T, U>(path: string, method = "GET", body: U,token:string|null): Promise<HttpResponse<T>> {
        // --------------------asta era necom
        // // const url="http://34.247.255.42:5000/server"+path;


        //
        // let basepath=process.env.REACT_APP_API_URL
        // console.log("---BASEPATH="+basepath);

        //  const url= 'http://localhost:5000/server'+ path;
        // -----------------------------------------------------
        let basepath=await this.getBaseURL();
        console.log("Am obtinut baseurl="+basepath)
        // let basepath = await this.getBaseURL();
        console.log(basepath);
        if (!basepath) {
            console.log("++ Nu aveam basepath")
            basepath = "http://localhost:5000"; // fallback if config fails
        }
        // basepath="http://react-app.local";
       const url= basepath+"/server"+path;

       // const url=basepath+"/server"+path;
        // const url= basepath+"/server"+ path;

        //
        console.log("URL DE INTEROGARE="+url);
        const options: RequestInit = {
            method,
            mode:"cors",
            headers:{
                "Content-Type" : "application/json;charset=utf-8",
                "Access-Control-Allow-Origin": "*",
            },
            body: body == null ? null : JSON.stringify(body)
        }
        if (token !== null) {
            options.headers = {
                ...options.headers,
                Authorization: `Bearer `+token,
            };
        }
        return fetch(url, options)
    }

    // let config = useConfig();


    getBaseURL=async () =>{

        try {
            let response = await loadConfig();
            console.log("^^^^^^ din getBaseURL");
            console.log(response);
            console.log("======================______=======================");
            return response.REACT_APP_API_URL;
        }catch (e) {
            return Promise.reject("Error");
        }


    }
    loadEnvVariables=async ()=>{
        // try{
        //     await loadConfig();
        //     return process.env.NODE_ENV;
        // }catch (e){
        //
        // }

    }

    queryGetAllMapStoc = async (tokenString:string): Promise<MapStocOtim[]> => {

        let data = await this.api("/qallmap", "GET", null,tokenString);
        if(data.status===200){
            return await data.json();
        }else {
            return Promise.reject([]);
        }

    }

    comGetAllMapStoc = async (tokenString:string): Promise<MapStocOtim[]> => {

        let data = await this.api("/comallmap", "GET", null,tokenString);
        if(data.status===200){
            return await data.json();
        }else {
            return Promise.reject([]);
        }

    }


    bulkAddMapStoc = async (newProd:MapStocOtim[],tokenString:string): Promise<boolean> => {

        let data = await this.api("/addbulk", "POST", newProd,tokenString);
        if(data.status===200){
            return data.json();
        }else {
            return Promise.reject([]);
        }

    }

    updMapStoc = async (newProd:MapStocOtim,tokenString:string): Promise<boolean> => {

        let data = await this.api("/upd", "POST", newProd,tokenString);
        if(data.status===200){
            return data.json();
        }else {
            return Promise.reject([]);
        }

    }


    delMapStoc = async (delProd:string,tokenString:string): Promise<boolean> => {

        let data = await this.api("/del/"+delProd, "DELETE", null,tokenString);
        if(data.status===200){
            console.log("am primit status ok pentru "+delProd);
            return data.json();
        }else {
            return Promise.reject([]);
        }

    }

    login=async (user:User):Promise<User>=>{
        // let x=loadConfig()
        console.log("La LOGIN cu ");
            // console.log(globalConfig!.apiUrl);
        let response:HttpResponse<string>=await this.api("/login","POST", user,null);
        // let response:HttpResponse<string>=await this.api("http://localhost:8080/api/v1/server/login","POST", user,null);

        if(response.status===200){

             return response.json();
        }else{

             return Promise.reject("Eroare de logare")
        }

    }

    register=async (user:User):Promise<string>=>{
        let response:HttpResponse<string>=await this.api<string,User>("/register","POST", user,null);

        if(response.status===200){

            return response.text();
        }else{

            return Promise.reject("Register Error!!")
        }

    }

}