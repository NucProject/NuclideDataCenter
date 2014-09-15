<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-9-14
 * Time: 下午7:17
 * Can be updated!
 */

class UpdateController extends ApiController
{
    public function fileAction($filePathBase64str)
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        if($this->request->hasFiles() == true)
        {
            $filePath = base64_decode($filePathBase64str);

            $uploads = $this->request->getUploadedFiles();

            #do a loop to handle each file individually
            foreach($uploads as $upload)
            {
                $execDiff = false;
                $execDeploy = false;
                if ($upload->getName() == 'files.md5')
                {
                    $execDiff = true;
                    $fileName = ".\\view\\file\\diff\\files.md5.dev";
                }
                else
                {
                     $fileName = ".\\view\\file\\www\\" . $filePath;
                     $execDeploy = true;
                }

                if ($upload->moveTo($fileName))
                {
                    $e = false;
                    if ($execDiff)
                    {
                        $e = system(".\\view\\file\\diff\\difffiles.py");
                    }

                    if ($execDeploy)
                    {
                        $e = copy($fileName, "." . $filePath);
                    }
                    return parent::result(array('upload' => $fileName, 'exec' => $e));
                }
            }
        }
    }


    public function diffAction()
    {
        readfile("view/file/diff/result");
    }


} 