// ==UserScript==
// @name         GMOJ Better
// @namespace    https://greasyfork.org/zh-CN/users/1223216-znpdco
// @version      1.8.25
// @description  可能会维护的GMOJ加强插件
// @author       ZnPdCo
// @match        https://gmoj.net/*
// @match        https://znpdco.github.io/gmoj/gmbt-settings.html
// @match        https://znpdco.github.io/gmoj/gmbt-notice.html
// @icon         https://gmoj.net/favicon.ico
// @grant        unsafeWindow
// @grant        GM_log
// @grant        GM_openInTab
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @require      https://unpkg.com/jquery@3.4.1/dist/jquery.js
// @license      MIT
// @connect      localhost
// @connect      update.greasyfork.org
// @connect      znpdco.github.io
// @downloadURL https://update.greasyfork.org/scripts/484886/GMOJ%20Better.user.js
// @updateURL https://update.greasyfork.org/scripts/484886/GMOJ%20Better.meta.js
// ==/UserScript==
const GmojTitle = 'GMOJ Better';

(function () {
    // 通知内容，下面两个notice不可以删掉，更新工具将会以此识别更新公告
    // notice-st
    function get_notice() {
        return "GMOJ 更新，进行对应更新"
    }
    // notice-ed

    // 版本号
    localStorage.setItem("version", "1.8.25");
    // debug
    //if(location.href.includes('?debug')) localStorage.setItem("version", "11451419198100");

    // OJ名称
    var ojName = 'serior';
    // 脚本版本
    var scriptVersion = localStorage.getItem("version");

    function inject_script(url, callback) {
        var script = document.createElement('script');
        script.src = url;
        script.onload = function () {
            if (callback) {
                callback();
            }
        }
        document.head.appendChild(script);
    }

    function inject_style(url, callback) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = function () {
            if (callback) {
                callback();
            }
        }
        document.head.appendChild(link);
    }


    // @param module     模块名称
    // @param type       模块类型，0表示布尔类模块，1表示字符串类模块
    // @param val        默认值
    // @param name       显示名称
    // @param func       执行函数
    // @param tips       提示
    const boolModule = 0;
    const strModule = 1;
    const buttonModule = 2;
    var modules = [];

    function registerModule(module, type, val, name, tips, func) {
        // 当没有初始值时设置为初始值，当点击了重置所有功能时设置为初始值
        if (GM_getValue(module) === undefined || localStorage.getItem("reset") == "true") {
            GM_setValue(module, val);
        }
        // 渲染设置页
        if (location.href.includes('https://znpdco.github.io/gmoj/gmbt-settings.html')) {
            if (type === boolModule) {
                var checked = '';
                if (GM_getValue(module) == true) {
                    checked = 'checked';
                }
                $('#settings').append(`
                <div class="mb-3 mt-3">
                    <label class="form-label" id="${module}-label"></label>
                    <input class="form-check-input" type="checkbox" id="${module}" ${checked}>
                </div>`);
                $(`#${module}-label`).text(name + '：');
                $(`#${module}`).click(function () {
                    GM_setValue($(this).attr('id'), $(this).is(':checked'));
                });
            } else if (type === strModule) {
                $('#settings').append(`
                <div class="mb-3 mt-3">
                    <label class="form-label" id="${module}-label"></label>
	                <input class="form-control" id="${module}">
                </div>`);
                $(`#${module}-label`).text(name + '（' + tips + '）：');
                $(`#${module}`).val(GM_getValue(module));
                $(`#${module}`).on('input', function () {
                    GM_setValue($(this).attr('id'), $(this).val());
                });
            } else if (type === buttonModule) {
                $('#settings').append(`
                <div class="mb-3 mt-3">
                    <label class="form-label" id="${module}-label"></label>
	                <button type="button" class="btn btn-primary" id="${module}">确定</button>
                </div>`);
                $(`#${module}-label`).text(name + '：');
                $(`#${module}`).click(function () {
                    func();
                });
            }
        } else if (!location.href.includes('https://znpdco.github.io/gmoj') && (type === strModule || (type === boolModule && GM_getValue(module) === true))) {
            // 当不是设置页时执行功能（推入到要执行的模块）
            modules.push(func);
        }
    }

    // 加一个等待，用于等待所有功能注册完毕
    setTimeout(function () {
        localStorage.setItem("reset", "false");
    }, 200);

    function runScript() {
        // 找不到 #page_content 元素：页面是 file 界面，只执行一次
        // 每次切换页面都是重新刷新 #page_content 元素内的内容，所以加一个 reloadchecker 元素，如果有就不执行
        // 后面这一个replace判断忘了是因为什么，但是要留着
        if ($('#page_content').length == 0 || (!$('#page_content')[0].innerHTML.includes('<reloadchecker></reloadchecker>') && $('#page_content').html().replace('<reloadchecker></reloadchecker>', '') != '')) {
            $('#page_content').append('<reloadchecker></reloadchecker>');
            for (var i = 0; i < modules.length; i++) {
                var func = modules[i];
                func();
            }
            if ($('#page_content').length == 0) {
                clearInterval(window.reloadChecker);
            }
        }
        if ($('#logout').length && !$('#gmbt-ratings-rank').length && GM_getValue('show-rating')) {
            $(`<a id="gmbt-ratings-rank" href="#ratings" style="text-decoration: none">
                    <i class="icon-signal" style="margin-left: 3px"></i>
                </a>`).insertAfter('#logout');
        }
        if ($('#logout').length && !$('#gmbt-settings').length) {
            $(`<a id="gmbt-settings" href="https://znpdco.github.io/gmoj/gmbt-settings.html" style="text-decoration: none">
                    <i class="icon-wrench" style="margin-left: 3px"></i>
                </a>`).insertAfter('#logout');
        }
    }
    if (!location.href.includes('https://znpdco.github.io/gmoj')) {
        // 这个元素用于与后端交互，当 display 为 none 时，说明页面切换完毕，可以执行脚本
        $('body').append(`<callbackground></callbackground>`)

        // 这段脚本必须注入页面执行，因为调用了页面函数。用于监听函数执行
        $(`<script>
		var observer = new MutationObserver(() => {
			try {
				let _set_page_content = set_page_content;
				set_page_content = (selector, url, success) => {
					_set_page_content(selector, url, success)
					const jqDom = $(selector).find("#vue-app")
					jqDom.length && jqDom[0].__vue__.$destroy()
					$.ajax({
						type: "GET",
						url: url,
						success: (data) => {
							if (selector == "#page_content") {
								$('callbackground').css({'display': 'none'})
							}
						},
						error: (xhr, statusText, error) => {
								$('callbackground').css({'display': 'none'})
						}
					});
				}
				observer.disconnect();
			}
			catch(e) { }
		});
		observer.observe((document.head), { subtree: true, childList: true });
    	</script>`).insertAfter('body');

        // 监听 callbackground 元素，当 display 为 none 时，说明页面切换完毕，可以执行脚本
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type == "attributes") {
                    if (mutation.target.style.display == 'none') {
                        mutation.target.style.display = 'block';
                        runScript()
                    }
                }
            });
        });
        observer.observe($('callbackground')[0], {
            attributes: true, //configure it to listen to attribute changes,
            attributeFilter: ['style']
        });

        // 为了防止上述脚本失效，每隔 200ms 重新执行一次 runScript
        window.reloadChecker = setInterval(function () {
            runScript()
        }, 200);
    }

    // 自动选择语言
    registerModule('set-lang', strModule, '["c++14", "c++11", "c++", "c", "pascal"]', '设置「提交语言优先级」', '提交代码界面选择语言优先级', function () {
        var order = JSON.parse(GM_getValue('set-lang'));
        for (var i = 0; i < order.length; i++) {
            var lang = order[i];
            var Lang = lang.substring(0, 1).toUpperCase() + lang.substring(1);  // customtest的选项为首字母大写
            if ($('.one-file .language').length && $('.one-file .language').find(`option[value="${lang}"]`).length) { // 代码提交界面
                $('.one-file .language').val(lang);
                break;
            }
            if ($('.run_control .language').length && $('.run_control .language').find(`option[value="${Lang}"]`).length) { // CustomTest界面
                $('.run_control .language').val(Lang);
                break;
            }
        }
    });

    // 添加界面锁，防止断网后手残
    registerModule('add-locker', boolModule, true, '添加「界面锁」按钮', null, function () {
        if ($('#problem_judge_details').length) {
            $('#problem_judge_details').eq(0).append('<a id="locker" class="gmojbetter icon-lock" title="锁定/解锁页面"></a>');
            $('#locker').click(function () {
                if ($('#locker').hasClass('icon-lock')) {
                    $('#locker').toggleClass('icon-lock');
                    $('#locker').toggleClass('icon-refresh');

                    $('a,button,input,span,select').not('.gmojbetter').attr('disabled', true).css('pointer-events', 'none');
                    window.addEventListener('beforeunload', function (e) {
                        e.preventDefault();
                    });

                    setInterval(function () {
                        $('a,button,input,span,select').not('.gmojbetter').attr('disabled', true).css('pointer-events', 'none');
                        window.addEventListener('beforeunload', function (e) {
                            e.preventDefault();
                        });
                    }, 1000);
                } else {
                    location.reload();
                    $('.overlay').css({ 'z-index': '1000', 'display': 'block' });
                    $('.overlay').animate({ opacity: '0.5' }, 250);
                }
            });
        }
    });

    // 自动打开比赛所有试题
    registerModule('add-open-problems', boolModule, true, '添加「打开比赛所有试题」按钮', null, function () {
        var problems = $('#contest_problems a');
        if (problems.length) {
            $('.nav').eq(1).append('<li><a id="open_problems" style="cursor: pointer;" class="gmojbetter">打开所有题目</a></li>');
            $('#open_problems').click(function () {
                for (var i = problems.length - 1; i >= 0; i--) {
                    GM_openInTab(problems[i].href, true);
                }
            });
        }
    });

    // 复制文操
    registerModule('add-copy-fileio', boolModule, true, '添加「复制文件操作」按钮', null, function () {
        var fileio = $('#header-problem-type .label');
        if (fileio.eq(0).text().includes('.in')) {
            $('#problem_judge_details').eq(0).append('<a id="fileio" class="gmojbetter icon-file" title="复制文件操作"></a>');
            $('#fileio').click(function () {
                $('#fileio')[0].className = 'gmojbetter icon-ok';
                setTimeout(function () {
                    $('#fileio')[0].className = 'gmojbetter icon-file';
                }, 1000);
                var code = GM_getValue('set-copy-fileio').replaceAll('{cr}', '\n').replaceAll('{tab}', '\t').replaceAll('{input}', fileio.eq(0).text()).replaceAll('{output}', fileio.eq(1).text());
                GM_setClipboard(code);
            });
        }
        if (location.href.includes('result')) {
            // 检查页面是否更新，更新就重新添加按钮（这个页面切换选项卡内容会重新渲染）
            clearInterval(window.fileioChecker);
            window.fileioChecker = setInterval(function () {
                if ($('#fileio').length == 0) {
                    $('.alert:contains("下载第一个未通过的测试点")').append(`<a id="fileio" class="gmojbetter icon-file" title="复制文件操作"></a>`)
                    $('#fileio').click(function (e) {
                        if (GM_getValue('set-download-path') == '') {
                            alert('请在设置中设置你的浏览器文件下载地址！');
                            location.href = 'https://znpdco.github.io/gmoj/gmbt-settings.html#:~:text=%E8%AE%BE%E7%BD%AE%E3%80%8C%E5%A4%8D%E5%88%B6%E6%95%B0%E6%8D%AE%E6%96%87%E4%BB%B6%E6%93%8D%E4%BD%9C%E3%80%8D%E6%95%B0%E6%8D%AE%E6%96%87%E4%BB%B6%E4%B8%8B%E8%BD%BD%E5%9C%B0%E5%9D%80';
                            return;
                        }
                        $('#fileio')[0].className = 'gmojbetter icon-ok';
                        setTimeout(function () {
                            $('#fileio')[0].className = 'gmojbetter icon-file';
                        }, 1000);
                        var path = GM_getValue('set-download-path').replaceAll('\\', '\\\\');
                        var name1 = "", name2 = "", namein = "", nameout = "";
                        name1 = $(e.target).prev().text();
                        name2 = $(e.target).prev().prev().text();

                        if (name1.includes('.in')) {
                            namein = name1;
                            if (name2.includes('.out')) {
                                nameout = name2.replace('.out', '.ans');
                            }
                            if (name2.includes('.ans')) {
                                nameout = name2.replace('.ans', '.out');
                            }
                        } else if (name2.includes('.in')) {
                            namein = name2;
                            if (name1.includes('.out')) {
                                nameout = name1.replace('.out', '.ans');
                            }
                            if (name1.includes('.ans')) {
                                nameout = name1.replace('.ans', '.out');
                            }
                        }
                        var code = GM_getValue('set-copy-fileio').replaceAll('{cr}', '\n').replaceAll('{tab}', '\t').replaceAll('{input}', path + namein).replaceAll('{output}', path + nameout);
                        GM_setClipboard(code);
                    });
                }
            }, 200);
        }
    });
    registerModule('set-copy-fileio', strModule, '{cr}{tab}freopen("{input}", "r", stdin);{cr}{tab}freopen("{output}", "w", stdout);', '设置「复制文件操作」代码', '文件操作代码？（‘{input}’为输入文件名（含后缀），‘{output}’为输出文件名（含后缀），‘{cr}’为换行，‘{tab}’为tab）', function () { });
    registerModule('set-download-path', strModule, '', '设置「复制数据文件操作」数据文件下载地址', '也就是浏览器下载文件放在哪儿，例如“C:\\Users\\Administrator\\Downloads\\”，务必在地址最后面添加“\\”', function () { });

    // 传送cph
    registerModule('add-cph', boolModule, true, '添加「cph传送」按钮', null, function () {
        if ($('.sample_pre').length) {
            $('#problem_judge_details').eq(0).append('<a id="cph" class="gmojbetter icon-download" title="传送到cph"></a>');
            $('#cph').click(async function () {
                // 发送cph
                async function postCph(post, data) {
                    return new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            url: `http://localhost:${post}/`,
                            method: "POST",
                            data: data,
                            onload(f) {
                                if (f.status === 502) {
                                    resolve(false);
                                }
                                resolve(true);
                            },
                            onerror(e) {
                                resolve(false);
                            }
                        })
                    });
                }
                // 这里是狗屎
                var url = location.href.replace('?gmojproblemset', '');
                var url_list = location.hash.replace('?gmojproblemset', '').split('/');
                var nums = [];
                for (let i = 0; i < url_list.length; i++) {
                    if (/^\d+$/.test(url_list[i])) { // 如果这个是数字，说明是pid
                        nums.push(url_list[i]);
                    }
                }
                var name = 'GMOJ_' + nums.join('_');
                name = window.prompt('cph题目名称？', name);
                if (name == null) return;
                const test = $('.sample_pre');
                let res_test = [];
                var in_test = [], out_test = [];
                for (let i = 0; i < test.length; i++) {
                    test.eq(i).html(test.eq(i).html().replaceAll('<br>', '\n'));
                    var line = test.eq(i).text().split('\n');
                    var text = "";
                    for (let j = 0; j <= line.length; j++) {
                        if (j != line.length && !line[j].includes('样例') && !line[j].includes('输入') && !line[j].includes('输出')) {
                            if (line[j] != '') {
                                text += line[j].replace(/\u00a0/g, ' ');
                                text += '\n';
                            }
                        } else if (text != '') {
                            if (i % 2 == 0) in_test.push(text);
                            else out_test.push(text);
                            text = '';
                        }
                    }
                }
                for (let i = 0; i < in_test.length; i++) {
                    res_test.push({
                        input: in_test[i],
                        output: out_test[i]
                    })
                }

                var data = JSON.stringify({
                    name: name,
                    url: url,
                    tests: res_test
                });

                // 用户自定义端口
                if (GM_getValue('set-cph') != undefined && GM_getValue('set-cph') != 27121 && GM_getValue('set-cph') != 10045) {
                    res = await postCph(GM_getValue('cph-post'), data);
                    if (res) {
                        $('#cph').toggleClass('icon-ok');
                        $('#cph').toggleClass('icon-download');
                        setTimeout(function () {
                            $('#cph').toggleClass('icon-ok');
                            $('#cph').toggleClass('icon-download');
                        }, 1000);
                        return;
                    }
                }

                res = await postCph('27121', data); // 常见端口
                if (res) {
                    $('#cph').toggleClass('icon-ok');
                    $('#cph').toggleClass('icon-download');
                    setTimeout(function () {
                        $('#cph').toggleClass('icon-ok');
                        $('#cph').toggleClass('icon-download');
                    }, 1000);
                    return;
                }
                res = await postCph('10045', data); // 小熊猫默认端口
                if (res) {
                    $('#cph').toggleClass('icon-ok');
                    $('#cph').toggleClass('icon-download');
                    setTimeout(function () {
                        $('#cph').toggleClass('icon-ok');
                        $('#cph').toggleClass('icon-download');
                    }, 1000);
                    return;
                }
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    },
                    title: "GMOJ Better",
                    html: "cph跳转失败,请检查是否开启cph客户端,或者是否配置cph端口(一般情况下无需配置)<br/>如果你使用小熊猫3.1以及以上版本，传送应该成功了，具体参见<a href='https://github.com/royqh1979/RedPanda-CPP/issues/406'>该issue</a>。",
                    icon: "warning",
                });
            });
        }
    });
    registerModule('set-cph', strModule, '27121', '设置「cph传送」', 'cph端口号（默认为27121、10045，一般无需设置）', function () { });

    // 检查更新
    registerModule('open-check-update', boolModule, false, '开启「自动检查更新」', null, async function () {
        clearInterval(window.updateChecker);
        window.updateChecker = setInterval(function () {
            if (localStorage.getItem("version") != scriptVersion) {
                location.reload();
            }
        }, 100);
        const updateUrl = "https://update.greasyfork.org/scripts/484886/GMOJ%20Better.user.js";
        GM_xmlhttpRequest({
            method: "GET",
            url: updateUrl,
            onload: function (f) {
                if (!f.responseText.includes(`localStorage.setItem("version", "${localStorage.getItem("version")}");`)) {
                    var notice = eval(f.responseText.split('// ' + 'notice-st')[1].split('// ' + 'notice-ed')[0] + 'get_notice();')
                    Swal.fire({
                        title: "GMOJ Better",
                        html: "GMOJ Better 检测到新版本！是否更新？<br>更新信息：" + notice,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "更新！",
                        cancelButtonText: "不更新，并关闭自动更新。",
                    }).then((result) => {
                        if (result.isConfirmed) {
                            location.href = updateUrl;
                            Swal.fire({
                                title: "GMOJ Better",
                                html: "稍后将会弹出一个新窗口，请在新窗口中完成更新！<b>完成更新后，再点击此对话框的确定应用更新！</b>",
                                icon: "info",
                            }).then((result) => {
                                location.reload();
                            })
                        } else {
                            GM_setValue('open-check-update', false);
                        }
                    });
                }
            }
        });
    });

    // 在首页插入box
    registerModule('add-countdown', boolModule, true, '添加「首页倒计时」', null, async function () {
        if (window.boxHTML != null) {
            if ($('.hero-unit').length) {
                $(window.boxHTML).insertAfter('.thumbnail.span3');
            }
            return;
        }
        window.boxHTML = null;
        $.get("https://gmoj.net/senior/index.php/users/2022%E4%B8%89%E9%91%AB%E9%BB%84%E6%99%AF%E6%A2%B5", function (data, status) {
            var ele = $(data);
            var obj = JSON.parse(ele.find('i').text());
            var date = new Date(obj.date).getTime() - new Date().getTime();
            var days = Math.ceil(date / (24 * 3600 * 1000));

            window.boxHTML = `<div class="thumbnail span3">
<legend><h4>${GmojTitle}</h4></legend>
<ul class="unstyled text-success">
<li><strong>V${localStorage.getItem("version")}</strong></li>
<li><strong>距离${obj.title}还剩${days}天</strong></li>
</ul>
</div>`;
            if ($('.hero-unit').length) {
                $(window.boxHTML).insertAfter('.thumbnail.span3');
            }
        });
    });
    // 自动登录
    registerModule('open-auto-login', boolModule, true, '开启「自动登录」', null, async function () {
        if ($('[name="username"]').length && $('[name="password"]').length && $('.btn.btn-primary.pull-right').length) {
            if (GM_getValue(ojName + 'password') == undefined) {
                $('.btn.btn-primary.pull-right').click(function () {
                    GM_setValue(ojName + 'username', $('[name="username"]')[0].value);
                    GM_setValue(ojName + 'password', $('[name="password"]')[0].value);
                });
            }
        }
        if ($('[name="old_password"]').length) {
            if (GM_getValue(ojName + 'password') != undefined) {
                $('[name="old_password"]')[0].value = GM_getValue(ojName + 'password');
            }
        }
        if ($('#logout').length) {
            $('#logout').click(function () {
                GM_deleteValue(ojName + 'username');
                GM_deleteValue(ojName + 'password');
            });
        }
        if (GM_getValue(ojName + 'password') != undefined) {
            $.ajax({
                type: "GET",
                url: 'index.php/main/userinfo',
                success: function (data) {
                    if (data.includes('NOT LOGIN!')) {
                        $.ajax({
                            type: "POST",
                            url: 'index.php/main/login',
                            data: {
                                "username": GM_getValue(ojName + 'username'),
                                "password": GM_getValue(ojName + 'password')
                            },
                            success: function (data) {
                                if (!data.includes('success')) {
                                    GM_deleteValue(ojName + 'username');
                                    GM_deleteValue(ojName + 'password');
                                } else {
                                    location.reload()
                                }
                            }
                        });
                    }
                }
            });
        }

    });

    // rating
    registerModule('show-rating', boolModule, true, '开启「Rating计算与显示」', null, function () {
        if (location.hash.includes('#users/')) {
            if ($('#ratings').length == 0) {
                $(`<div id='ratings' class='gmojbetter'></div>`).insertAfter('#user-header');
                $(`<input id='ratings_data' class='gmojbetter' />`).insertAfter('#user-header');
                $('#ratings_data').hide();
                var name = decodeURIComponent(location.hash).replace('#users/', '');
                GM_xmlhttpRequest({
                    method: "GET",
                    url: 'https://znpdco.github.io/gmoj/ratings.json',
                    onload: function (f) {
                        var data = JSON.parse(f.responseText)
                        var ratings = [0]
                        var cid = [0]

                        if (!(name in data["ratings"])) return;

                        for (i = 0; i < data["ratings"][name].length; i++) {
                            ratings.push(data["ratings"][name][i]['rating'])
                            cid.push(data['ratings'][name][i]['cid'])
                        }

                        var title = {
                            text: 'Ratings'
                        };
                        var subtitle = {
                            text: 'Source: GMOJ Better'
                        };
                        var xAxis = {
                            title: {
                                text: 'Contest ID'
                            },
                            categories: cid
                        };
                        var yAxis = {
                            max: 4000, // 定义Y轴 最大值
                            min: 0, // 定义最小值
                            title: {
                                text: 'Score'
                            },
                            plotLines: [{
                                value: 0,
                                width: 1,
                                color: '#808080'
                            }],
                            plotBands: [
                                { color: '#a00', lineWidth: 1, from: 3000, to: 4000 },
                                { color: '#f33', lineWidth: 1, from: 2600, to: 2999 },
                                { color: '#f77', lineWidth: 1, from: 2400, to: 2599 },
                                { color: '#ffbb55', lineWidth: 1, from: 2300, to: 2399 },
                                { color: '#ffcc88', lineWidth: 1, from: 2100, to: 2299 },
                                { color: '#f8f', lineWidth: 1, from: 1900, to: 2099 },
                                { color: '#aaf', lineWidth: 1, from: 1600, to: 1899 },
                                { color: '#77ddbb', lineWidth: 1, from: 1400, to: 1599 },
                                { color: '#7f7', lineWidth: 1, from: 1200, to: 1399 },
                                { color: '#ccc', lineWidth: 1, from: 0, to: 1199 },
                            ]

                        };

                        var tooltip = {
                            backgroundColor: '#FCFFC5',
                        }

                        var legend = {
                            enabled: false // 禁用图例
                        };
                        var series = [
                            {
                                name: 'Ratings',
                                data: ratings,
                                color: "#edc241",
                                shadow: {
                                    color: 'black',
                                    width: 5,
                                    offsetX: 1,
                                    offsetY: 1,
                                    opacity: 0.1
                                }
                            }
                        ];

                        var json = {};

                        json.title = title;
                        json.subtitle = subtitle;
                        json.xAxis = xAxis;
                        json.yAxis = yAxis;
                        json.tooltip = tooltip;
                        json.legend = legend;
                        json.series = series;

                        $('#ratings_data').val(JSON.stringify(json))

                        $(`<script>
                            var json = JSON.parse($('#ratings_data').val())
                            $('#ratings').highcharts(json);
                            </script>`).insertAfter('#user-header');

                    }
                });
            }
        }
        if (location.hash == '#ratings') {
            if ($('#ratings-rank').length == 0) {
                $('.alert').hide();
                $('#page_content').append(`<iframe allowtransparency="true" height="560px" width="100%" frameborder=0 src="https://znpdco.github.io/gmoj/gmbt-ratings.html?rank=10"></iframe>`);
            }
        }
    });

    registerModule('show-download-ac-code', boolModule, true, '开启「下载AC代码」', null, function () {
        if (location.hash.includes('#main/statistic')) {
            $(`<button class="gmojbetter btn btn-small" id="downloadSRC" style="margin-left: 10px;">下载当前页所有AC代码到文件夹（For Hack，AC后才可用）</button>`).insertAfter('.btn.btn-small');
            $('#downloadSRC').click(async function () {
                async function getSRC() {
                    window.savecode = {};
                    var len = $('tbody tr').length;
                    for (var i = 0; i < len; i++) {
                        var ele = $(`tbody tr:eq(${i}) a`);
                        if (ele[1].innerText.includes('评测通过') && (ele[2].innerText == 'C++' || ele[2].innerText == 'C++11' || ele[2].innerText == 'C++14')) {
                            var url = `index.php/main/codedownload/${$('tbody tr:eq(' + i + ') a')[2].href.split('/')[6].replace('?currentTab=sourceFile', '')}/SRC?ext=cpp`;
                            $.ajax({
                                type: "GET",
                                url: url,
                                async: false,
                                success: function (code) {
                                    var name = ele[0].innerText;
                                    window.savecode[name] = code;
                                },
                                error: function (xhr, statusText, error) { }
                            });
                        }
                    }
                }
                try {
                    await Promise.all([getSRC()]);
                    const dirHandle = await showDirectoryPicker();
                    for (const [name, code] of Object.entries(window.savecode)) {
                        const newdirHandle = await dirHandle.getDirectoryHandle(name, { create: true });
                        const docHandle = await newdirHandle.getFileHandle('SRC.cpp', { create: true });
                        const writable = await docHandle.createWritable();
                        writable.write(code);
                        writable.close();
                    }
                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.onmouseenter = Swal.stopTimer;
                            toast.onmouseleave = Swal.resumeTimer;
                        },
                        title: "GMOJ Better",
                        html: "下载成功！",
                        icon: "success",
                    });
                } catch (error) {
                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.onmouseenter = Swal.stopTimer;
                            toast.onmouseleave = Swal.resumeTimer;
                        },
                        title: "GMOJ Better",
                        html: "下载失败！",
                        icon: "error",
                    });
                }
            });
        }
    });


    // 自动刷新status等页面
    registerModule('open-auto-reload', boolModule, true, '开启「自动刷新状态页」', null, function () {
        function add_info() {
            var ele = $('table');
            // ele.find('tbody td:contains("等待评测")').append(`<img src="https://img.uoj.ac/utility/bear-thinking.gif" style="width: 40px;">`)
            // ele.find('tbody td:contains("运行中")').append(`<img src="https://img.uoj.ac/utility/bear-flying.gif" style="width: 40px;">`)
            $('table').html(ele.html());
        }
        function auto_reload() {
            if (location.href.includes('status')) {
                $.ajax({
                    type: "GET",
                    url: hash_to_url(window.location.hash),
                    success: function (data) {
                        if (location.href.includes('status')) {
                            var ele = $(data);
                            $('table').html(ele.find('table').html());
                            add_info();
                        }
                    },
                    error: function (xhr, statusText, error) {
                        $('#page_content').html('<div class="alert"><strong>Error: ' + ' ' + error + '</strong></div>');
                    }
                });
            }
        }
        if (window.set_reload != true) {
            window.set_reload = true;
            setInterval(auto_reload, 1000);
            if (location.href.includes('status')) {
                add_info();
            }
        };
        auto_reload();
    });

    // customtest 优化
    registerModule('better-customtest', boolModule, true, '开启「CustomTest优化」', null, function () {
        if(window.set_del_freopen != true) {
            window.set_del_freopen = true;
            $(`<script>
		    function setSubmitBtn() {
		    	$('li:contains("Use standard IO.")').html('你可以使用标准输入输出或文件输入输出，<code>freopen</code> 将在编译时忽略。')
		    	$("#btn_run").unbind('click')
                $("#btn_run").click(function() {
                    $("#btn_run").prop('disabled', true);
                    if ($('#toggle_editor').attr("checked"))
                        editor.save();
                    codeText = $('#texteditor').val();
                    if (codeText.length == 0 && $('#use_text').attr('checked')=='checked'){
                        alert("You are attempting to run empty code!");
                        $("#btn_run").prop('disabled', false);
                        return false;
                    }
                    if ((['C', 'C++', 'C++11', 'C++14']).includes($('#language').val()) && codeText.indexOf('%I64d') != -1){
                        alert("Please be reminded to use '%lld' specificator in C/C++ instead of '%I64d'!");
                        $("#btn_run").prop('disabled', false);
                        return false;
                    }

                    codeText = "#include <cstdio>\\n#define freopen(a, b, c)\\n" + codeText;

                    $('#texteditor').val(btoa(unescape(encodeURIComponent(codeText))));

                    var withO2 = $('[name="with_o2"]').prop('checked');

                    $('#custom_run').ajaxSubmit({
                        url: 'index.php/customtest/run',
                        success: function(responseText) {
                            destroyEditor();
                            $('#page_content').html(responseText.replace('#include <cstdio>\\n#define freopen(a, b, c)\\n', ''));
                            if(withO2) $('[name="with_o2"]').prop('checked', true);
                            var Memory = parseInt($('label:contains("Memory") span').text().replace(' KB', ''));
                            if(Memory != -1) Memory = (Memory / 1024).toFixed(2);
                            $('label:contains("Memory") span').html(Memory + ' MB');
				    		setSubmitBtn();
                            $("#btn_run").prop('disabled', false);
                        }
                    });
                    return false;
                });
	    	}
            setInterval(function() {
                setSubmitBtn();
            }, 500);
            </script>`).insertAfter('body')
        }
    });


    registerModule('show-sol', boolModule, true, '开启「题解显示优化」', null, function () {
        if ($('#sidebar').length) {
            var ele = $('#sidebar .well:contains("题解") .sidebar_fieldset_rows')
            for (let i = 0; i < ele.length; i++) {
                var filename = ele.eq(i).text();
                if (filename.includes('.txt') || filename.includes('.md') || filename.includes('.pdf') || filename.includes('.in') || filename.includes('.out') || filename.includes('.html') || filename.includes('.docx') || filename.includes('.pptx') || !filename.includes('.')) {
                    ele.eq(i).find('div:eq(0)').append(`<a href="${ele.eq(i).find('a:eq(0)').attr('href')}" class="gmojbetter icon-download" title="下载"></a>`)
                    ele.eq(i).find('a:eq(0)').attr('href', '/sol?sol=' + window.location.origin + window.location.pathname + ele.eq(i).find('a:eq(0)').attr('href'));
                }
            }
        }
    });
    // 因为不是oj页了，放在外面会执行得快一点
    if (GM_getValue('show-sol') == true) {
        // 接下来的代码也是狗屎QwQ
        if (location.pathname == '/sol') {
            $('body').hide();
            $('<p id="loading">加载中</p>').insertAfter('body');
            // 题解url格式为 ***/filename/0/solution_path，要把最后面的东西去掉才能判断后缀名
            var filename = location.search.replace('?sol=', '').replace('/0/solution_path', '');
            if (filename.endsWith('.pdf') || filename.endsWith('.txt') || filename.endsWith('.md') || filename.endsWith('.in') || filename.endsWith('.out') || filename.endsWith('.html')) {
                var xhr = new XMLHttpRequest()
                xhr.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        var url = URL.createObjectURL(this.response)
                        $(`<iframe id="sol" class="sol" style="position: fixed; z-index: 100000;" allowtransparency="true" height="100%" width="100%" frameborder=0 src="${url}"></iframe>`).insertAfter('body')
                        URL.revokeObjectURL(url);
                        document.getElementById('sol').onload = function () {
                            $('#loading').hide();
                            var filename = location.search.replace('?sol=', '').replace('/0/solution_path', '');
                            // markdown 渲染
                            if (filename.endsWith('.md')) {
                                var ele = document.getElementById('sol').contentWindow;
                                const marked = ele.document.createElement('script');
                                marked.src = 'https://cdn.bootcdn.net/ajax/libs/marked/2.0.3/marked.js';
                                ele.document.head.appendChild(marked);
                                marked.onload = function () {
                                    $('#sol').contents().find("body").append(`<script>
									window.MathJax = {
										tex: {inlineMath: [['$', '$'], ['\\(', '\\)']]}
									};
									</script>`)
                                    const math = ele.document.createElement('script');
                                    math.src = 'https://cdn.bootcss.com/mathjax/3.0.5/es5/tex-chtml.js';
                                    math.async = true;
                                    ele.document.head.appendChild(math);
                                    math.onload = function () {
                                        $('#sol').contents().find("body").append(`<script>
										document.body.innerHTML = marked(document.body.innerText);
										MathJax.typeset();
										</script>`)
                                    }
                                }
                            }
                        }
                    }
                }
                xhr.open('GET', location.search.replace('?sol=', ''))
                xhr.responseType = 'blob'
                xhr.send()
            } else if (filename.endsWith('.docx')) {
                const doc = document.createElement('script');
                doc.src = 'https://cdn.jsdelivr.net/npm/docx-preview@0.1.15/dist/docx-preview.js';
                document.head.appendChild(doc);
                doc.onload = function () {
                    const jszip = document.createElement('script');
                    jszip.src = 'https://cdn.bootcdn.net/ajax/libs/jszip/3.10.1/jszip.min.js';
                    document.head.appendChild(jszip);
                    jszip.onload = function () {
                        $('head').html($('head').html())
                        $('<div id="container"></div>').insertAfter('body')
                        $('body').append(`<script>
						var xhr = new XMLHttpRequest()
						xhr.onreadystatechange = function () {
							if (this.readyState == 4 && this.status == 200) {
								let blob = new Blob([this.response], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
								docx.renderAsync(blob, document.getElementById('container')).then((res) => {
									document.getElementById('loading').style.display = "none";
								});
							}
						}
						xhr.open('GET', location.search.replace('?sol=', ''))
						xhr.responseType = 'blob'
						xhr.send()
						</script>`)
                    }
                }
            } else if (filename.endsWith('.pptx')) {
                // 我不会实现，就这么做了，哈哈
                $('<div style="margin-right: auto; margin-left: auto; width: 900px;" id="container"></div>').insertAfter('body')
                inject_style("https://pptx.js.org/pages/css/pptxjs.css", function () {
                    inject_style("https://pptx.js.org/pages/css/nv.d3.min.css", function () {
                        inject_script("https://pptx.js.org/pages/js/jquery-1.11.3.min.js", function () {
                            inject_script("https://pptx.js.org/pages/js/jszip.min.js", function () {
                                inject_script("https://pptx.js.org/pages/js/filereader.js", function () {
                                    inject_script("https://pptx.js.org/pages/js/d3.min.js", function () {
                                        inject_script("https://pptx.js.org/pages/js/nv.d3.min.js", function () {
                                            inject_script("https://pptx.js.org/pages/js/pptxjs.js", function () {
                                                inject_script("https://pptx.js.org/pages/js/divs2slides.js", function () {
                                                    $('body').append(`<script>
														var xhr = new XMLHttpRequest()
														xhr.onreadystatechange = function () {
															if (this.readyState == 4 && this.status == 200) {
																var url = URL.createObjectURL(this.response)
																$("#container").pptxToHtml({
																	pptxFileUrl: url,
																	slideMode: false,
																	keyBoardShortCut: false,
																	slideModeConfig: {  //on slide mode (slideMode: true)
																		first: 1,
																		nav: false, /** true,false : show or not nav buttons*/
																		navTxtColor: "white", /** color */
																		navNextTxt:"&#8250;", //">"
																		navPrevTxt: "&#8249;", //"<"
																		showPlayPauseBtn: false,/** true,false */
																		keyBoardShortCut: false, /** true,false */
																		showSlideNum: false, /** true,false */
																		showTotalSlideNum: false, /** true,false */
																		autoSlide: false, /** false or seconds (the pause time between slides) , F8 to active(keyBoardShortCut: true) */
																		randomAutoSlide: false, /** true,false ,autoSlide:true */
																		loop: false,  /** true,false */
																		background: "black", /** false or color*/
																		transition: "default", /** transition type: "slid","fade","default","random" , to show transition efects :transitionTime > 0.5 */
																		transitionTime: 1 /** transition time in seconds */
																	}
																});
																URL.revokeObjectURL(url);
																$('#loading').hide();
															}
														}
														xhr.open('GET', location.search.replace('?sol=', ''))
														xhr.responseType = 'blob'
														xhr.send()
													</script>
													`)
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            }
        }
    }

    registerModule('download-problem-or-contest', boolModule, true, '开启「复制题目、下载比赛」', null, async function () {
        // bug 应该很多
        // 获取md版题面
        function getMarkdownProblem(html) {
            // 不会分割，乱写的
            var data = '{' + html.split('rawMarkdown = {')[1].split('$(\'.div_samplecase_markdown div\')')[0].replace('problem_description', '"problem_description"').replace('input_description', '"input_description"').
            replace('output_description', '"output_description"').replace('data_constraint', '"data_constraint"').replace('hint', '"hint"')
            var json = JSON.parse(data);
            if(!("problem_description" in json)) json["problem_description"] = "";
            if(!("input_description" in json)) json["input_description"] = "";
            if(!("output_description" in json)) json["output_description"] = "";
            if(!("data_constraint" in json)) json["data_constraint"] = "";
            if(!("hint" in json)) json["hint"] = "";
            return json
        }
        // 获取html版题面
        function getHtmlProblem(html) {
            var datas = $(html).find('#problem_main_content > .well')
            return {problem_description: datas.find('legend:contains("题目描述") + div').text(),
                    input_description: datas.find('legend:contains("输入") + div').text(),
                    output_description: datas.find('legend:contains("输出") + div').text(),
                    data_constraint: datas.find('legend:contains("数据范围限制") + div').text(),
                    hint: datas.find('legend:contains("提示") + div').text()}
        }
        // 获取样例
        function getSimple(html) {
            const test = $(html).find('.sample_pre')
            var in_test = [], out_test = [];
            var res_test = "";
            for (let i = 0; i < test.length; i++) {
                test.eq(i).html(test.eq(i).html().replaceAll('<br>', '\n'));
                var line = test.eq(i).text().split('\n');
                var text = "";
                for (let j = 0; j <= line.length; j++) {
                    if (j != line.length && !line[j].includes('样例') && !line[j].includes('输入') && !line[j].includes('输出')) {
                        if (line[j] != '') {
                            text += line[j];
                            text += '\n';
                        }
                    } else if (text != '') {
                        if (i % 2 == 0) in_test.push(text);
                        else out_test.push(text);
                        text = '';
                    }
                }
            }
            for (let i = 0; i < in_test.length; i++) {
                res_test += `### 样例输入 ${i+1}

\`\`\`
${in_test[i]}
\`\`\`

### 样例输出 ${i+1}

\`\`\`
${out_test[i]}
\`\`\`
`
            }
            return res_test;
        }
        // 获取download文件
        async function getDownload(html) {
            return new Promise((resolve) => {
                var download = $(html).find('a:contains("下发文件")').prop('href');
                if(download == undefined) resolve([]);
                download = location.pathname + 'index.php/main/showdownload/' + download.split('/')[download.split('/').length - 1]
                $.ajax({
                    type: 'GET',
                    url: download,
                    success: function(html){
                        var ele = $(html).find('a');
                        var res = [];
                        for(let i = 0; i < ele.length; i ++) {
                            res.push({'name': ele.eq(i).text(), 'url': ele.eq(i).prop('href')})
                        }
                        resolve(res);
                    }
                });
            });
        }
        // 获取题目数据
        async function getProblem(url) {
            return new Promise((resolve) => {
                $.ajax({
                    type: 'GET',
                    url: url,
                    success: async function(html){
                        var data = {};
                        if(html.includes('rawMarkdown = {')) {
                            data = getMarkdownProblem(html);
                        } else {
                            data = getHtmlProblem(html);
                        }
                        data['simple'] = getSimple(html);
                        data['title'] = $(html).find('h2').text();
                        data['download'] = await getDownload(html);
                        resolve(data)
                    }
                });
            });
        }
        // 获取题目md
        function getProblemMarkdown(data) {
            return `# ${data['title']}

## 题目描述

${data['problem_description']}

## 输入

${data['input_description']}

## 输出

${data['output_description']}

## 样例数据

${data['simple']}

## 数据范围限制

${data['data_constraint']}

## 提示

${data['hint']}
`;
        }
        async function download(url,name,dir) {
            const tmp = await Promise.all([fetch(url),
                                           (await dir.getFileHandle(name, { create: true })).createWritable()]);
            await tmp[0].body.pipeTo(tmp[1]);
        }
        async function getContent(contestId) {
            try {
                const dirHandle = await showDirectoryPicker();
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    },
                    title: "GMOJ Better",
                    html: "下载将开始。下载可能较慢，请耐心等待……",
                    icon: "info",
                });
                const parser = new DOMParser();
                var tmp = await fetch(location.pathname + 'index.php/contest/problems/' + contestId);
                var ele = parser.parseFromString(await tmp.text(), 'text/html');
                var num = ele.querySelectorAll('tbody > tr').length;
                for (var i = 0; i < num; ++i) {
                    var data = await getProblem(location.pathname + 'index.php/contest/show/' + contestId + '/' + i)
                    const newdirHandle = await dirHandle.getDirectoryHandle(data['title'], { create: true });
                    const docHandle = await newdirHandle.getFileHandle('statements.md', { create: true });
                    const writable = await docHandle.createWritable();
                    writable.write(getProblemMarkdown(data));
                    writable.close();
                    for(var j = 0; j < data['download'].length; j ++) {
                        await download(data['download'][j]['url'], data['download'][j]['name'], newdirHandle)
                    }
                }
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    },
                    title: "GMOJ Better",
                    html: "下载成功！",
                    icon: "success",
                });
            }
            catch (error) {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    },
                    title: "GMOJ Better",
                    html: "下载失败！",
                    icon: "error",
                });
            }
        }
        if (location.hash.split("#contest/home/").length>1
            && $("div.hero-unit").length) {
            $("div.hero-unit")[0].innerHTML +=
                `<button class="btn btn-primary" id="download-content">下载本场比赛</button>`
            $('#download-content').click(async function() {
                await getContent(location.hash.split("#contest/home/")[1])
            })
        }
        if ($('#problem_judge_details').length) {
            $('#problem_judge_details').eq(0).append('<a id="copy-md" class="gmojbetter icon-bookmark" title="复制题面"></a>');
            $('#copy-md').click(async function () {
                if(location.hash.includes('#contest/show/')) {
                    var data = await getProblem(location.pathname + 'index.php/contest/show/' + location.hash.replace('#contest/show/', '').split('/')[0] + '/' + location.hash.replace('#contest/show/', '').split('/')[1])
                    var md = getProblemMarkdown(data)
                    GM_setClipboard(md);
                } else {
                    var url = location.pathname + 'index.php/main/show/' + location.hash.replace('#main/show/', '').split('/')[0];
                    var data = await getProblem(url)
                    var md = getProblemMarkdown(data)
                    GM_setClipboard(md);
                }
            });
        }
    });

    registerModule('use-swal', boolModule, true, '开启「Sweet Alert」', null, async function () {
        $('body').append(`
        <script>
        alert = function(text) {
            Swal.fire({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                },
                html: text,
                icon: "info",
            })
        }
        </script>`)
    });


    registerModule('open-reset-settings', buttonModule, null, '重置「GMBT」的所有设置', null, function () {
        localStorage.setItem("reset", "true")
        location.reload();
    });

    window.boxHTML = null;

    const script = document.createElement('script');
    script.src = 'https://cdn.bootcdn.net/ajax/libs/sweetalert2/11.12.4/sweetalert2.all.min.js';
    document.head.appendChild(script);
    const script2 = document.createElement('script');
    script2.src = 'https://gmoj.net/senior/js/highcharts.js';
    document.head.appendChild(script2);
})();