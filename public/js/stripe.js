/* eslint-disable*/

const stripe = Stripe('pk_test_51PXiAPIrUp6ys0AhBFE0JwIpivlLd9WisGkCN2MdMBTqUbnrz7g7kCV1ndrevarcZC1jJ02aYTHfevJQBjrGx8rt00sc948XoN')

const bookButton =document.querySelector('#book-tour')

const bookTour =async tourId => {
    try{
    //1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
    //2) Create checkout from + charge credit card
        await stripe.redirectToCheckout({
            sessionId:session.data.session.id
        })
    }catch(err){
        console.log(err);
        alert(err.response.data.message)
    }
}

if(bookButton){
    bookButton.addEventListener('click', e=>{
        e.target.textContent = 'Processing...'
        // const tourId = e.target.dataset.tourId same
        const {tourId} = e.target.dataset
        bookTour(tourId)
    })
}