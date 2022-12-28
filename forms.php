<?php
if(isset($_GET['NAME']) and isset($_GET['ADDRESS']) and isset($_GET['MESSAGE']))
{
    $name=$_GET['NAME'];
    $address=$_GET['ADDRESS'];
    $message=$_GET['MESSAGE'];

    $email_subject = "New Form submission";

    $email_body = "You have received a new message from the user $name.\n".
        "Here is the message:\n $message".

    $to = "tiagofc2000@gmail.com";

    $headers = "Reply-To: $address \r\n";


    if(mail($to,$email_subject,$email_body,$headers)) {

        echo 'Your mail has been sent successfully.';

    } else{

        echo 'Unable to send email. Please try again.';

    }
}
?>
