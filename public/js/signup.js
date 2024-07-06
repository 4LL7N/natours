/*eslint-disable*/

const SignForm = document.getElementById('signForm')



const Signup = async (name,email,password,passwordConfirm)=>{
    try{
        console.log('before axios');
    const res = await axios({
        method:'POST',
        url:'http://127.0.0.1:8000/api/v1/users/signup',
        data:{
            name,
            email,
            password,
            passwordConfirm
        }
    })
  
    if(res.data.status === 'success'){
        alert('Logged in successfully')
        window.setTimeout(() => {
            location.assign('/')
        },1500)
    }

    
    }catch(err){
        // showAlert('error',err.response.data.message)
        alert(err.response.data.message)
    }
}

if(SignForm){

    SignForm.addEventListener('submit',e=>{
    e.preventDefault()
    const name = document.getElementById('signName').value
    const email = document.getElementById('signEmail').value
    const password = document.getElementById('signPassword').value
    const passwordConfirm = document.getElementById('signPasswordConfirm').value
    
    Signup(name,email,password,passwordConfirm)
})
}else{
    console.log('no form');
}
