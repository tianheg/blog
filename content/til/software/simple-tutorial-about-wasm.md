---
title: 'Simple tutorial about WASM'
status: draft
date: 2025-06-15T19:22:54+08:00
header: Programming
---

WASM(webassembly) is a virtual assembly language for the browser. It is closer to the Hardware than JavaScript.

- [WebAssembly using Go (Golang) | Run Go programs in the browser](https://golangbot.com/webassembly-using-go/)
- [Access the browser's DOM from Go (Golang) using WebAssembly | golangbot.com](https://golangbot.com/go-webassembly-dom-access/)
- [golangbot/webassembly: Webassembly using Go](https://github.com/golangbot/webassembly)

We'll create a application that is used to format JSON.

Before:

```json
{"website":"golangbot.com", "tutorials": [{"title": "Strings", "url":"/strings/"}, {"title":"maps", "url":"/maps/"}, {"title": "goroutines","url":"/goroutines/"}]}
```

After:

```json
{
  "website": "golangbot.com",
  "tutorials": [
    {
      "title": "Strings",
      "url": "/strings/"
    },
    {
      "title": "maps",
      "url": "/maps/"
    },
    {
      "title": "goroutines",
      "url": "/goroutines/"
    }
  ]
}
```

### HelloWorld WASM Program Cross Compiled from Go
Here is the file structure:

```text
Documents/
└── webassembly
    ├── assets
    └── cmd
        ├── server
        └── wasm
```

```bash
mkdir -p ~/Documents/webassembly/assets \
~/Documents/webassembly/cmd  \
~/Documents/webassembly/cmd/server \
~/Documents/webassembly/cmd/wasm
```

First create a go module named `github.com/golangbot/webassembly`.

```bash
cd ~/Documents/webassembly
go mod init github.com/golangbot/webassembly
```

`go mod init github.com/golangbot/webassembly` will create a file named `go.mod`:

```mod
module github.com/golangbot/webassembly

go 1.22.0
```

Create `main.go` with the following contents inside =~/Documents/webassembly/cmd/wasm=:

```go
package main

import (
    "fmt"
)

func main() {
    fmt.Println("Go Web Assembly")
}
```

Let's cross compile the above Go program into WebAssembly.

```bash
cd ~/Documents/webassembly/cmd/wasm/
GOOS=js GOARCH=wasm go build -o  ../../assets/json.wasm
```

Only cross compiling the `main` package to WebAssembly.

```bash
./assets/json.wasm
# bash: ./assets/json.wasm: cannot execute binary file: Exec format error
```

Why we got this error?

Because the binary is a `wasm` related binary and is supposed to be run inside a browser sandbox. The Linux OSes don't understand the format of this binary.

#### JS Glue
We need some JS glue code to run `json.wasm`.

```bash
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ~/Documents/webassembly/assets/
```

#### index.html
```html
<!doctype html>
<html>
    <head>
        <meta charset="utf-8"/>
        <script src="wasm_exec.js"></script>
        <script>
            const go = new Go();
            WebAssembly.instantiateStreaming(fetch("json.wasm"), go.importObject).then((result) => {
                go.run(result.instance);
            });
        </script>
    </head>
    <body></body>
</html>
```

Now see the file structure:

```text
Documents/
└──webassembly/
        ├── assets
        │   ├── index.html
        │   ├── json.wasm
        │   └── wasm_exec.js
        ├── cmd
        │   ├── server
        │   └── wasm
        │       └── main.go
        └── go.mod
```

#### WebServer
Create `main.go` inside the `server` directory. The directory structure after creating `main.go` is provided below.

```text
Documents/
└── webassembly
        ├── assets
        │   ├── index.html
        │   ├── json.wasm
        │   └── wasm_exec.js
        ├── cmd
        │   ├── server
        │   │   └── main.go
        │   └── wasm
        │       └── main.go
        └── go.mod
```

Copy the following code to =~/Documents/webassembly/cmd/server/main.go=.

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    err := http.ListenAndServe(":9090", http.FileServer(http.Dir("../../assets")))
    if err != nil {
        fmt.Println("Failed to start server", err)
        return
    }
}
```

The above program creates a file server listening at port `9090` with the root at our `assets` folder. Let's run the server and see our first WebAssembly program running.

```bash
cd ~/Documents/webassembly/cmd/server/
go run main.go
```

Now we can see the output(`Go Web Assembly`) in the `http://localhost:9090/` page's console.

### Coding the JSON formatter
Add the following function to =~/Documents/webassembly/cmd/wasm/main.go=.

```go
func prettyJson(input string) (string, error) {
    var raw any
    if err := json.Unmarshal([]byte(input), &raw); err != nil {
        return "", err
    }
    pretty, err := json.MarshalIndent(raw, "", "  ")
    if err != nil {
        return "", err
    }
    return string(pretty), nil
}
```

The `MarshalIndent` function takes 3 parameters as input. The first one is the raw unformatted JSON, the second one is the prefix to add to each new line of the JSON. In this case, we don't add a prefix. The third parameter is the string to be appended for each indent of our JSON.

#### Exposing a function from Go to Javascript
Now we have the function ready but we are yet to expose this function to Javascript so that it can be called from the front end.

Go provides the [syscall/js](https://pkg.go.dev/syscall/js) package which helps in exposing functions from Go to Javascript.

The first step in exposing a function from `Go` to `JavaScript` is to create a [Func](https://pkg.go.dev/syscall/js#Func) type. Func is a wrapped Go function that can be called by JavaScript. The [FuncOf](https://pkg.go.dev/syscall/js#FuncOf) function can be used to create a `Func` type.

Add the following function to =~/Documents/webassembly/cmd/wasm/main.go=.

```go
func jsonWrapper() js.Func {
        jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) any {
                if len(args) != 1 {
                        return "Invalid no of arguments passed"
                }
                inputJSON := args[0].String()
                fmt.Printf("input %s\n", inputJSON)
                pretty, err := prettyJson(inputJSON)
                if err != nil {
                        fmt.Printf("unable to convert to json %s\n", err)
                        return err.Error()
                }
                return pretty
        })
        return jsonFunc
}
```

Here is the completed code.

```go
package main

import (
    "fmt"
    "encoding/json"
    "syscall/js"
)

func prettyJson(input string) (string, error) {
        var raw any
        if err := json.Unmarshal([]byte(input), &raw); err != nil {
                return "", err
        }
        pretty, err := json.MarshalIndent(raw, "", "  ")
        if err != nil {
                return "", err
        }
        return string(pretty), nil
}

func jsonWrapper() js.Func {
        jsonFunc := js.FuncOf(func(this js.Value, args []js.Value) any {
                if len(args) != 1 {
                        return "Invalid no of arguments passed"
                }
                inputJSON := args[0].String()
                fmt.Printf("input %s\n", inputJSON)
                pretty, err := prettyJson(inputJSON)
                if err != nil {
                        fmt.Printf("unable to convert to json %s\n", err)
                        return err.Error()
                }
                return pretty
        })
        return jsonFunc
}

func main() {
    fmt.Println("Go Web Assembly")
    js.Global().Set("formatJSON", jsonWrapper())
    <-make(chan struct{})
}
```

Compile and test the program.

```bash
cd ~/Documents/webassembly/cmd/wasm/
GOOS=js GOARCH=wasm go build -o  ../../assets/json.wasm
cd ~/Documents/webassembly/cmd/server/
go run main.go
```

#### Calling the Go function from JavaScript
Open the devtools, select console tab, input:

```javascript
formatJSON('{"website":"golangbot.com", "tutorials": [{"title": "Strings", "url":"/strings/"}]}')
```

Output:

```text
'{
 "tutorials": [
  {
   "title": "Strings",
   "url": "/strings/"
  }
 ],
 "website": "golangbot.com"
}'
```

### Creating the UI and calling the wasm function
Let's modify the existing =~/Documents/webassembly/assets/index.html= in the `assets` folder to include the UI.

```html
<!doctype html>
<html>  
    <head>
        <meta charset="utf-8"/>
        <script src="wasm_exec.js"></script>
        <script>
            const go = new Go();
            WebAssembly.instantiateStreaming(fetch("json.wasm"), go.importObject).then((result) => {
                go.run(result.instance);
            });
        </script>
    </head>
    <body>
         <textarea id="jsoninput" name="jsoninput" cols="80" rows="20"></textarea>
         <input id="button" type="submit" name="button" value="pretty json" onclick="json(jsoninput.value)"/>
         <textarea id="jsonoutput" name="jsonoutput" cols="80" rows="20"></textarea>
    </body>
    <script>
        var json = function(input) {
            jsonoutput.value = formatJSON(input)
        }
     </script>
</html>
```

Compile and run this program.

```bash
cd ~/Documents/webassembly/cmd/wasm/
GOOS=js GOARCH=wasm go build -o  ../../assets/json.wasm
cd ~/Documents/webassembly/cmd/server/
go run main.go
```

Input:

```json
{"website":"golangbot.com", "tutorials": [{"title": "Strings", "url":"/strings/"}, {"title":"maps", "url":"/maps/"}]}
```

Output:

```json
{
  "tutorials": [
    {
      "title": "Strings",
      "url": "/strings/"
    },
    {
      "title": "maps",
      "url": "/maps/"
    }
  ],
  "website": "golangbot.com"
}
```

#### Accessing the DOM from Go using JavaScript
In the above section, we called the `wasm` function, got the formatted JSON string output, and set the output text area with the formatted JSON using JavaScript.

There is one more way to achieve the same output. Instead of passing the formatted JSON string to javascript, it is possible to access the browser's [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) from Go and set the formatted JSON string to the output text area.

Let's see how this is done.

We need to modify the `jsonWrapper` function in =~/Documents/webassembly/cmd/wasm/main.go= to achieve this.

```go
func jsonWrapper() js.Func {
    jsonfunc := js.FuncOf(func(this js.Value, args []js.Value) any {
        if len(args) != 1 {
            return "Invalid no of arguments passed"
        }
        jsDoc := js.Global().Get("document")
        if !jsDoc.Truthy() {
            return "Unable to get document object"
        }
        jsonOuputTextArea := jsDoc.Call("getElementById", "jsonoutput")
        if !jsonOuputTextArea.Truthy() {
            return "Unable to get output text area"
        }
        inputJSON := args[0].String()
        fmt.Printf("input %s\n", inputJSON)
        pretty, err := prettyJson(inputJSON)
        if err != nil {
            errStr := fmt.Sprintf("unable to parse JSON. Error %s occurred\n", err)
            return errStr
        }
        jsonOuputTextArea.Set("value", pretty)
        return nil
    })

    return jsonfunc
}
```

Run this program again.

```bash
cd ~/Documents/webassembly/cmd/wasm/  
GOOS=js GOARCH=wasm go build -o  ../../assets/json.wasm  
cd ~/Documents/webassembly/cmd/server/  
go run main.go 
```

#### Error Handling
```go
func jsonWrapper() js.Func {
    jsonfunc := js.FuncOf(func(this js.Value, args []js.Value) any {
        if len(args) != 1  {
            return errors.New("Invalid no of arguments passed")
        }
        jsDoc := js.Global().Get("document")
        if !jsDoc.Truthy() {
            return errors.New("Unable to get document object")
        }
        jsonOuputTextArea := jsDoc.Call("getElementById", "jsonoutput")
        if !jsonOuputTextArea.Truthy() {
            return errors.New("Unable to get output text area")
        }
        inputJSON := args[0].String()
        fmt.Printf("input %s\n", inputJSON)
        pretty, err := prettyJson(inputJSON)
        if err != nil {
            errStr := fmt.Sprintf("unable to parse JSON. Error %s occurred\n", err)
            return errors.New(errStr)
        }
        jsonOuputTextArea.Set("value", pretty)
        return nil
    })
    return jsonfunc
}
```
