/**
 * Created by zhuomuniao1 on 14-6-5.
 */

$class("AdminManagerPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    _userListView: null,

    __constructor: function() {

    },

    onAttach: function(domNode) {
        console.log(111)
        domNode.find("a.add-admin").click(kx.bind(this, "addAdmin"));

        this._userListView = new ListView();
        var userListViewDomNode = this._userListView.create();
        userListViewDomNode.appendTo(domNode.find('div.users'));

        this._userListView.setHeaders([
            {'key':'id', 'type': 'id'},
            {'key':'username', 'name':'用户名'},
            {'key':'handle', 'name':'删除'},

        ]);

        var this_ = this;
        var api = "user/fetch/";
        this.ajax(api, null, function(data){
            var d = eval("(" + data + ")");
            if (d.errorCode == 0) {
                var users = d.results;
                for (var i in users) {
                    var user = users[i];

                    handle = '总管理员';
                    if (user.username != 'admin')
                        handle = "<a class='btn red del'>删除</a>";

                    this_._userListView.addEntry({
                        id: user.user_id,
                        username: user.username,
                        handle: handle,

                    });
                }
            }
        });

        this_._userListView._domNode.delegate('td a.del', 'click', function(){
            var tr = $(this).parent().parent();
            var userId = tr.attr('data-id');
            this_.deleteUser(userId, tr);
        });

    },

    deleteUser: function(userId, tr) {
        this.ajax('user/del/' + userId, null, function(data){
                var d = eval("(" + data + ")");
                if (d.errorCode == 0) {
                    tr.find('td').css('background-color', 'yellow');
                    setTimeout(function(){
                        tr.slideUp();
                    }, 500);
                }
        });
    },

    addAdmin: function() {
        console.log(11122)
        var payload = {
            "username": this.getUsername(),
            "password_md5": this.passwordMD5()
        };
        var this_ = this;
        this.ajax("user/register", payload, function(data){
            var d = eval("(" + data + ")");
            if (d.errorCode == 0) {
                var user = d.results;
                console.log(user)
                this_._userListView.addEntry({
                    id: user.user_id,
                    username: user.username,
                    handle: "<a class='btn red del'>删除</a>"

                });
            }
        });
    },

    passwordMD5: function() {
        var p = this._domNode.find("input.password").val();
        return hex_md5(p);
    },

    getUsername: function() {
        return this._domNode.find("input.username").val();
    }


});