<?php

class UserController extends ApiController
{
    public function initialize()
    {
		$this->view->disable();
    }

    public function testAction()
    {
        if (!$this->request->isGet())
        {
            return parent::error(Error::BadHttpMethod, '');
        }
        session_start();
        if (isset($_SESSION['uid']))
        {
            return parent::result(array());
        }
        else
        {
            return parent::error(Error::BadSession, '');
        }
    }

    public function registerAction()
    {
    	if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $payload = $this->request->getPost();
        $username = $payload['username'];
        $password = $payload['password_md5'];


        if (isset($username) && isset($password))
        {
            $users = User::find(array("username='$username'"));
            if (count($users) == 0)
            {
                $user = new User();
                $user->username = $username;
                $user->password = $password;
                $user->role = 1;

                if ($user->save() != false)
                {
                    session_start();
                    $userId = $user->user_id;
                    $_SESSION['uid'] = $userId;

                    return parent::result(array("user_id" => $userId,
                                                "register" => "OK"
                                            ));
                }
                else
                {
                    return parent::error(Error::BadRecord, "Save failed");
                }
            }
            else
            {
                return parent::error(Error::RegisterFailedForPhoneNumberExists, "This username has been registered");
            }
        }
        else
        {
            return parent::error(Error::RegisterFailedForBadUsernameOrPassword, "Both username and password are required");
        }

    }


    // SignIn with your username and password
    public function signInAction()
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $payload = $this->request->getPost();
        $username = $payload['username'];
        $password = $payload['password'];

        if (isset($username) && isset($password))
        {
            $users = User::find(array("username='$username' AND password='$password'"));
            if (count($users) > 0)
            {
                $user = $users[0];
                session_start();
                $userId = $user->user_id;
                $_SESSION['uid'] = $userId;

                return parent::result(array(
                    "user_id" => $userId,
                    "sign-in" => "OK"));
            }
            else
            {
                return parent::error(Error::AuthFailed, "Wrong username or password");
            }
        }
        else
        {
            return parent::error(Error::BadPayload, "Both username and password are required");
        }
    }

    // Clear the history
    public function clearAction()
    {
        // TODO: ... ...
    }

    public function signOutAction()
    {
        if ($this->request->isGet())
        {
            session_start() && session_destroy();
            return parent::result(array("sign-out" => "OK"));
        }
    }

    // TODO: Use more security hash algorithm.
    private static function hashPassword($password)
    {
        return md5($password);
    }
}