using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Uploadr
{
    public partial class UploadForm : Form
    {
        public string host;

        private string rootPath;

        private string md5Command;

        public UploadForm()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            string location = Assembly.GetExecutingAssembly().Location;
            string path = Path.GetDirectoryName(location);
            string configFile = Path.Combine(path, "config");

            if (File.Exists(configFile))
            {
                foreach (var line in File.ReadLines(configFile))
                {
                    string text = line.Trim();

                    if (text.ToLower().StartsWith("root"))
                    {
                        this.rootPath = text.Substring(text.IndexOf('=') + 1).Trim();
                        this.rootPathText.Text = this.rootPath;

                    }
                    else if (text.ToLower().StartsWith("host"))
                    {
                        this.host = text.Substring(text.IndexOf('=') + 1).Trim();
                    }
                    else if (text.ToLower().StartsWith("md5"))
                    {
                        this.md5Command = text.Substring(text.IndexOf('=') + 1).Trim();
                    }
                }
            }


        }

        private Uri GetUploadApi(string fileName)
        {
            var filePath = Path.GetFullPath(fileName);
            filePath = filePath.Substring(this.rootPath.Length);
            var filePathBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(filePath));
            string url = string.Format("{0}/update/file/{1}", host, filePathBase64);
            return new Uri(url);
        }

        private Uri GetUploadMd5Api()
        {
            string url = string.Format("{0}/update/file/files.md5", host);
            return new Uri(url);
        }

        private Uri GetDiffResultApi()
        {
            string url = string.Format("{0}/update/diff", host);
            return new Uri(url);
        }

        private void uploadButton_Click(object sender, EventArgs e)
        {
            if (File.Exists(this.filePathText.Text))
            {
                string fileName = this.filePathText.Text;
                this.UploadFile(fileName);
            }
            else
            {
                OpenFileDialog fileDialog = new OpenFileDialog();
                fileDialog.InitialDirectory = "C://";
                fileDialog.Filter = "All files (*.*)|*.*";
                fileDialog.FilterIndex = 1;
                fileDialog.RestoreDirectory = true;
                if (fileDialog.ShowDialog() == DialogResult.OK)
                {
                    this.filePathText.Text = fileDialog.FileName;
                }

            }
        }

        private void UploadFile(string fileName)
        {
            using (WebClient wc = new WebClient())
            {
                byte[] resultBytes = wc.UploadFile(this.GetUploadApi(fileName), fileName);
                string result = Encoding.ASCII.GetString(resultBytes);
                this.AppendText("上传文件[" + fileName + "]:" + result);
            }
        }


        private void UploadFilesByDiff()
        {
            using (WebClient wc = new WebClient())
            {
                string diff = wc.DownloadString(this.GetDiffResultApi());

                StringReader sr = new StringReader(diff);
                string l;
                while ((l = sr.ReadLine()) != null)
                {
                    string fileName = l.Trim();
                    if (string.IsNullOrEmpty(fileName))
                    {
                        continue;
                    }

                    fileName = fileName.TrimStart('\\', '/');
                    string filePath = Path.Combine(this.rootPath, fileName);
                    this.UploadFile(filePath);
                }
            }
        }

        private void syncButton_Click(object sender, EventArgs e)
        {
            this.debugTextBox.Items.Clear();
            string fileName = Path.Combine(this.rootPathText.Text, "view/file/diff/files.md5");

            if (File.Exists(fileName))
            {
                File.Delete(fileName);
            }
            
            using (Process p = Process.Start(this.md5Command))
            {
                p.WaitForExit();
                this.AppendText("生成全部文件的MD5列表");
            }

            int tryTimes = 0;
            string result = string.Empty;
            while (tryTimes < 10)
            {
                if (File.Exists(fileName))
                {
                    using (WebClient wc = new WebClient())
                    {
                        byte[] resultBytes = wc.UploadFile(this.GetUploadMd5Api(), fileName);
                        result = Encoding.ASCII.GetString(resultBytes);
                        this.AppendText("上传MD5列表文件:" + result);
                        break;
                    }
                }
                Thread.Sleep(500);
                this.AppendText("上传MD5列表文件(重试)");
                tryTimes++;
            }

            this.UploadFilesByDiff();

        }

        private void AppendText(string text)
        {
            this.debugTextBox.Items.Add(text);
        }
    }
}
