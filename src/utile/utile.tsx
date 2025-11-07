import { AppConfig } from '../models/AppConfig';
// import {getInstance} from "http-proxy-middleware/dist/logger";

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_APP_NAME?: string
    // 👆 adaugă aici toate variabilele tale din .env
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
export async function loadConfig(): Promise<AppConfig> {
    console.log(import.meta.env.REACT_APP_API_URL);
    const response = await fetch(`${import.meta.env.REACT_APP_API_URL}/ui/config/config.json`);
    console.log("****************** SUNT IN LOADcONFIG **************");
    console.log(response);
    console.log("///// raspuns");

    if (response.status!=200) {
        console.error('Failed to load configuration', response.statusText);
        return { BASE_URL: '',REACT_APP_API_URL: '' };
    }

    let config = response.json().then(a=>{
        if(typeof a=="object"){
            return a as AppConfig;
        }else{
            return {BASE_URL: '',REACT_APP_API_URL: ''}
        }

    }).catch(e=>{return {BASE_URL: '',REACT_APP_API_URL: ''} as AppConfig});

    console.log(config);
    console.log("->->===============================|||||||||||||||||||||-----------");

    return config;
}