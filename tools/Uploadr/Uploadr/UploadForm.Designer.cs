namespace Uploadr
{
    partial class UploadForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.uploadButton = new System.Windows.Forms.Button();
            this.rootPathText = new System.Windows.Forms.TextBox();
            this.filePathText = new System.Windows.Forms.TextBox();
            this.syncButton = new System.Windows.Forms.Button();
            this.debugTextBox = new System.Windows.Forms.ListBox();
            this.SuspendLayout();
            // 
            // uploadButton
            // 
            this.uploadButton.Location = new System.Drawing.Point(327, 40);
            this.uploadButton.Name = "uploadButton";
            this.uploadButton.Size = new System.Drawing.Size(75, 23);
            this.uploadButton.TabIndex = 0;
            this.uploadButton.Text = "上传";
            this.uploadButton.UseVisualStyleBackColor = true;
            this.uploadButton.Click += new System.EventHandler(this.uploadButton_Click);
            // 
            // rootPathText
            // 
            this.rootPathText.BackColor = System.Drawing.SystemColors.Info;
            this.rootPathText.Location = new System.Drawing.Point(13, 13);
            this.rootPathText.Name = "rootPathText";
            this.rootPathText.Size = new System.Drawing.Size(308, 21);
            this.rootPathText.TabIndex = 1;
            // 
            // filePathText
            // 
            this.filePathText.Location = new System.Drawing.Point(13, 40);
            this.filePathText.Name = "filePathText";
            this.filePathText.Size = new System.Drawing.Size(308, 21);
            this.filePathText.TabIndex = 1;
            // 
            // syncButton
            // 
            this.syncButton.Location = new System.Drawing.Point(273, 451);
            this.syncButton.Name = "syncButton";
            this.syncButton.Size = new System.Drawing.Size(129, 23);
            this.syncButton.TabIndex = 2;
            this.syncButton.Text = "同步整个目录";
            this.syncButton.UseVisualStyleBackColor = true;
            this.syncButton.Click += new System.EventHandler(this.syncButton_Click);
            // 
            // debugTextBox
            // 
            this.debugTextBox.FormattingEnabled = true;
            this.debugTextBox.ItemHeight = 12;
            this.debugTextBox.Location = new System.Drawing.Point(13, 81);
            this.debugTextBox.Name = "debugTextBox";
            this.debugTextBox.Size = new System.Drawing.Size(386, 364);
            this.debugTextBox.TabIndex = 4;
            // 
            // UploadForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(411, 491);
            this.Controls.Add(this.debugTextBox);
            this.Controls.Add(this.syncButton);
            this.Controls.Add(this.filePathText);
            this.Controls.Add(this.rootPathText);
            this.Controls.Add(this.uploadButton);
            this.Name = "UploadForm";
            this.Text = "文件上传助手";
            this.Load += new System.EventHandler(this.Form1_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button uploadButton;
        private System.Windows.Forms.TextBox rootPathText;
        private System.Windows.Forms.TextBox filePathText;
        private System.Windows.Forms.Button syncButton;
        private System.Windows.Forms.ListBox debugTextBox;
    }
}

