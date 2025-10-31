import styled from "styled-components";

export const WrapperKclLogin=styled.div`
  //width:100%;
  //height: 100%;
  margin:0px;
  padding: 0px;
  display: flex; 
  flex-direction: column;  
  align-items: center;  
  justify-content: center;
  position: relative;  
   
    .spinn{
        position: absolute;
        margin-top: 30vh;
        z-index: 2000;
    }
    .kcl-login{
        position: relative;
        margin: auto;
        margin-top: 200px;
        padding-top: 20px;
        width: 600px;
        height: 300px;
        background-color: #5d6166;
    }

    
    .p-2.border.rounded{
        margin-top: 7px;
        width: 500px;
        
    }

    .flex.gap-2{
        margin-top: 10px;
    }

    .p-2.rounded{
        width: 150px;
        
    }

    .bg-blue-600{
        background-color: cornflowerblue;
        
    }

    .bg-gray-500{
        background-color: indianred;
        
    }


    .myalert{

        position:absolute;
        top: 50px;
        z-index: 2001;
    }

    //.alert{
    //    position: absolute;
    //    z-index:2001 !important;
    //    width:90% !important;
    //    top: 30px;
    //    left: 5%;
    //    margin: 100px auto !important;
    //    transition: opacity 1s ease-in-out !important; /* Tranzitie de 1 secundă */
    //
    //}
    .alert {
        position: absolute; /* rămâne absolut față de .kcl-login */
        z-index: 2001;
        width: 90%; /* ocupă 90% din container, nu din ecran */
        top: 50%; /* distanță față de partea de sus a containerului */
        left: 5%; /* margină stânga-dreapta */
        margin: 0; /* elimină marginile globale */
        transition: opacity 1s ease-in-out;
    }

    .fade-in-out {
        opacity: 0;
        transition: opacity 1s ease-in-out !important; /* Tranzitie de 1 secundă */
    }

    .fade-in-out.visible {
        opacity: 1;
    }


    







`