import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useUser, useSupabaseClient} from "@supabase/auth-helpers-react";
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [email, setEmail] = useState('');
  const [images, setImages] = useState([])
  const user = useUser();
  const supabase = useSupabaseClient();

  // https://bbezplycunohkcefcdos.supabase.co/storage/v1/object/public/images/2b32e28b-afc4-4bb0-bf59-31510a06668e/9e49478e-6a60-41f6-b6b3-acf302bcb16f

  const CDNUrl = 'https://bbezplycunohkcefcdos.supabase.co/storage/v1/object/public/images'

  async function getImages() {
    const {data, error} = await supabase
    .storage
    .from('images')
    .list(user?.id + '/', { //images from user's gallery
      limit: 100, //limits amount of images shown
      offset: 0, //from the first part of the search results
      sortBy: { column: 'name', order: 'asc'}
    });
    //[ image1, image2, image3 ]
    // image1: {name: 'abc.png'}
    // to load image1: url.com/abc.png -> hosted image

    if(data !== null){
      setImages(data)
    } else {
      alert('Error loading images');
      console.log(error);
    }
  }

  useEffect(() => {
    if(user) {
      getImages();
    }
  }, [user])

  async function magicLinkLogin() {
    const {data, error} = await supabase.auth.signInWithOtp({
      email:email
    });
    if (error) {
      alert("Error communicating with supabase, please check that you entered your email correctly!");
      console.log(error);
    } else {
      alert("Check your email!")
    }
  }

  async function signOut(){
    const { error } = await supabase.auth.signOut();
  }


  async function uploadImage(e) {
    let file = e.target.files[0];

    //Can only upload to logged in user's gallery.

    const { data, error } = await supabase
      .storage
      .from('images')
      .upload(user.id + '/' + uuidv4(), file) //This provides a unique id for each file.
    if(data) {
      getImages();
    } else {
      console.log(error);
    }
  }

  async function deleteImage(imageName){
    const { error } = await supabase
    .storage
    .from('images')
    .remove([ user.id + '/' + imageName])

    if(error) {
      alert(error);
    } else {
      getImages();
    }
  }


  return (
    <Container align='center' className='container-sm mt-4'>
      {/* If the user exists, show them the images. If they don't, show them the login. */}

      { user === null ?
      
        <>
          <h1>Welcome to The Pictures</h1>
          <Form>
            <Form.Group className='mb-3' style={{maxWidth: '500px'}}>
              <Form.Label>Enter email to sign in with a Magic Link</Form.Label>
              <Form.Control
                type='email'
                placeholder='Enter email'
                onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>
            <Button variant='primary' onClick={() => magicLinkLogin()}>
              Get Magic Link
            </Button>
          </Form>
        </>
    
      :

        <>
          <h1>Your Pictures!</h1>  
          <p>Current user: {user.email}</p>
          <Button onClick={() => signOut()}>Sign Out</Button>
          <hr/>
          <p>Use the Choose File button below to upload an image to your gallery</p>
          <Form.Group className='mb-3' style={{maxWidth: '500px'}}>
            <Form.Control type='file' accept='image/png, image/jpeg, image/gif' onChange={(e) => uploadImage(e)}/>


          </Form.Group>
          <hr/>
          <h3>Your Images</h3>
          <Row xs={1} md={3} className="g-4">
            {images.map((image) => {
              return (
                <Col key={CDNUrl + user.id + "/" + image.name}>
                  <Card>
                    <Card.Img variant='top' src={CDNUrl + user.id + "/" + image.name} />
                    <Card.Body>
                      <Button variant='danger' onClick={() => deleteImage(image.name)}>Delete</Button>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </>

      }

    </Container>
    
  );
}

export default App;
