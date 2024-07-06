/*eslint-disable*/

// import axios from 'axios'
// import {showAlert,hideAlert} from './alerts.js'


const form = document.querySelector('.form--login')
const UpdateForm = document.querySelector('.form-user-data')
const PasswordForm = document.querySelector('.form-user-settings')
const logOutBtn = document.querySelector('.nav__el--logOut')


const login = async (email,password)=>{
    try{
        console.log('before axios');
    const res = await axios({
        method:'POST',
        url:'http://127.0.0.1:8000/api/v1/users/login',
        data:{
            email,
            password
        }
    })
  
    if(res.data.status === 'success'){
        alert('Logged in successfully')
        window.setTimeout(() => {
            location.assign('/')
        },1500)
    }

    console.log(res);
    }catch(err){
        // showAlert('error',err.response.data.message)
        alert(err.response.data.message)
    }
}

if(form){

form.addEventListener('submit',e=>{
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    login(email,password)
})
}

const logout =async () => {
    try{
        const res = await axios({
            method:'GET',
            url:'http://127.0.0.1:8000/api/v1/users/logout'
        })
        console.log(res);
        if(res.data.status === 'success')location.href = '/'
    }catch(err){
        alert('Error logging out! try again')
    }
}

if(logOutBtn){
    logOutBtn.addEventListener('click',logout)
}


// type is either password or data
const updateSettings = async (data, type) => {
    try{
        const url = type === 'password' ? 'http://127.0.0.1:8000/api/v1/users/updateMyPassword':'http://127.0.0.1:8000/api/v1/users/updateMe'

        const res= await axios({
            method:'PATCH',
            url,
            data
        })
        if(res.data.status == 'success'){
            alert(`${type.toUpperCase()} updated successfully`)
        }
    }catch(err){
        console.log(err);
        alert(err.response.data.message)
    }
}

if(UpdateForm){
    UpdateForm.addEventListener('submit',e=>{
        e.preventDefault()

        const form = new FormData()
        form.append('name',document.getElementById('name').value)
        form.append('email',document.getElementById('email').value)
        // const name = document.getElementById('name').value
        // const email = document.getElementById('email').value
        
        form.append('photo',document.getElementById('photo').files[0]/*first because we upload only one picture*/)

        console.log(form);

        updateSettings(form,'data')
    })
}

if(PasswordForm){
    console.log();
    PasswordForm.addEventListener('submit',async e=>{
        e.preventDefault()
        document.querySelector('.btn--save-password').textContent = 'Updating...'
        
        const passwordCurrent = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value
        
        await updateSettings({passwordCurrent,password,passwordConfirm},'password')

        document.querySelector('.btn--save-password').textContent = 'SAVE PASSWORD'
        document.getElementById('password-current').value=''
        document.getElementById('password').value=''
        document.getElementById('password-confirm').value=''
        console.log(document.getElementById('password-confirm').value);
    })
}