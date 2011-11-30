onmessage = function (aMsg) {
    var data = aMsg.data;
    switch (data.name) {
        case "onTop" :
            onTop(data);
        break;
    }
}

function onTop(data) {
    var lib = ctypes.open("user32.dll");
    if (!lib) {
        postMessage({"name": "error", "value": "can't open lib"});
        return;
    }
    var FindWindow = lib.declare(
        "FindWindowW", ctypes.winapi_abi, ctypes.int,
        ctypes.jschar.ptr,
        ctypes.jschar.ptr
    );
    var GetWindowLong = lib.declare(
        "GetWindowLongW", ctypes.winapi_abi, ctypes.long,
        ctypes.int,
        ctypes.int
    );
    var SetWindowPos = lib.declare(
        "SetWindowPos", ctypes.winapi_abi, ctypes.bool,
        ctypes.int,
    ctypes.int,
    ctypes.int, ctypes.int, ctypes.int, ctypes.int,
    ctypes.unsigned_int
    );
    var hWnd = FindWindow("MozillaWindowClass", data.title);
    if (!hWnd) postMessage({"name": "error", "value": "not find hWnd"});
    const GWL_EXSTYLE = -20, WS_EX_TOPMOST = 0x00000008;
    var isTopMost = GetWindowLong(hWnd, GWL_EXSTYLE) & WS_EX_TOPMOST;
    const HWND_TOPMOST = -1, HWND_NOTOPMOST = -2;
    var hia = isTopMost ? HWND_NOTOPMOST : HWND_TOPMOST;
    const SWP_NOSIZE = 0x0001,
          SWP_NOMOVE = 0x0002,
          SWP_NOREDRAW = 0x0008;
          SWP_NOACTIVATE = 0x0010;
    SetWindowPos(hWnd, hia, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOREDRAW);
    postMessage({"name": "result", "value": !isTopMost});
    lib.close();
}
