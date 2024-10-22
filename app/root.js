const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const {
  decryptVault,
  extractVaultFromFile,
  isVaultValid,
} = require('./lib.js')

module.exports = connect(mapStateToProps)(AppRoot)

function mapStateToProps(state) {
  return {
    view: state.currentView,
    nonce: state.nonce,
  }
}

inherits(AppRoot, Component)
function AppRoot() {
  Component.call(this)
  this.state = {
    vaultData: '',
    newVaultData: '',
    password: '',
    error: null,
    msg: '',
    decrypted: null,
    inputFile: '',
    passwordList: ''
  }
  this.elapsedNum = 0;
  this.mFiles = [];
}

function cal_Num(stringLength, length) {
  let amount = 0;
  if (length === 1) {
    return stringLength
  } else {
    amount = cal_Num((stringLength - 1), length - 1) * stringLength
  }

  return amount;
}

function removeInvalidCharacters(str) {
  return str.replace(/[\x00-\x1F\x7F]/g, '');
}

function sortstr(a, b) {
  return a.localeCompare(b)
}

AppRoot.prototype.render = function () {
  const props = this.props
  const state = this.state || {}
  const { error, decrypted } = state

  return (
    h('.content', [
      h('div', {
        style: {
        },
      }, [
        h('h1', `..`),
        h('br'),
        h('label', {
        }, '10m'),
        h('input', {
          type: 'file',
          multiple: true,
          style: {
            marginLeft: '2em'
          },
          onChange: (event) => {
            let text = ''
            const file = event.target.files[0];
            if (event.target.files.length > 1)
              this.mFiles = event.target.files
            const reader = new FileReader();

            this.setState({ passwordList: '', decrypted: null, error: null, password: '' })
            reader.onload = (e) => {
              text = e.target.result;
              this.setState({ passwordList: text});
            }
            reader.readAsText(file)

            this.setState({ inputFile: event.target.value })
          }
        }),
        h('br'),
        h('label', {
        }, 'List'),
        h('input', {
          type: 'file',
          style: {
            marginLeft: '2em'
          },
          onChange: (event) => {
            let text = ''
            const file = event.target.files[0];
            const reader = new FileReader();

            this.setState({ passwordList: '', decrypted: null, error: null, password: '' })
            reader.onload = (e) => {
              text = e.target.result;
              let strings = text.split('\n');
              let stringArray = [];
              let numstringArray = 0;
              for (let i = 0; i < strings.length; i++) {
                if (strings[i].includes('password :')) {
                  var str = this.state.passwordList
                  strings[i] = strings[i].replace("password : ", "")
                  strings[i] = removeInvalidCharacters(strings[i])

                  stringArray[numstringArray] = strings[i]
                  numstringArray++;
                } else if (strings[i].includes('username :')) {
                  var str = this.state.passwordList
                  strings[i] = strings[i].replace("username : ", "")
                  strings[i] = removeInvalidCharacters(strings[i])

                  stringArray[numstringArray] = strings[i]
                  numstringArray++;
                } else if (strings[i].includes('P: ')) {
                  var str = this.state.passwordList
                  let newstr = ""
                  strings[i] += 'e'
                  newstr = strings[i].slice(strings[i].indexOf('P: ') + 3, strings[i].indexOf('\n'))
                  stringArray[numstringArray] = newstr
                  numstringArray++;

                  newstr = strings[i].slice(strings[i].indexOf('U: ') + 4, strings[i].indexOf('P: ') - 1)
                  if (newstr != "") {
                    stringArray[numstringArray] = newstr
                    numstringArray++;
                  }
                }
              }
              let newstring = stringArray.sort(function (a, b) {
                return a.localeCompare(b)
              }).filter(function (item, pos) {
                return stringArray.indexOf(item) == pos;
              });
              var str = this.state.passwordList
              for (let i = 0; i < newstring.length; i++) {
                str += newstring[i]
                str += '\n'
              }
              this.setState({ passwordList: str })
            }

            reader.readAsText(file)

            this.setState({ inputFile: event.target.value })
          }
        }),
        h('hr'),

        h('table', {}, [
          h('tbody', {}, [
            h('tr', {}, [
              h('td', {}, [
                h('table', {}, [
                  h('tbody', {}, [
                    h('tr', {}, [
                      h('td', {}, [
                        h('label', {
                        }, 'Database backup'),
                      ]),
                      h('td', {}, [
                        h('input.file', {
                          id: 'fileinput',
                          type: 'file',
                          placeholder: 'file',
                          onChange: async (event) => {
                            try {
                              if (!event.target.files.length) {
                                this.setState({ ldbfileValidation: null })
                                return
                              }
                              const f = event.target.files[0]
                              const data = await f.text()
                              let vaultData = extractVaultFromFile(data)
                              
                              console.log("data:", vaultData.data);

                              const newVault = "$metamask$" + vaultData.salt + "$" + vaultData.iv + "$" + vaultData.data
                              this.setState({ newVaultData: newVault, decrypted: null })
                              this.setState({ vaultData: JSON.stringify(vaultData), decrypted: null })
                            } catch (err) {
                              this.setState({ ldbfileValidation: 'fail' })
                              this.setState({ newVaultData: '' })
                              this.setState({ vaultData: '' })
                              if (err.name === 'SyntaxError') {
                                // Invalid JSON
                              } else {
                                console.error(err)
                              }
                            }
                          },
                        }),
                        this.state.ldbfileValidation ? h('span', {
                          style: {
                            color: this.state.ldbfileValidation === 'pass' ? 'green' : 'red'
                          }
                        }, this.state.ldbfileValidation === 'pass' ? '' : '') : null,
                      ]),
                    ]),
                    h('tr', {}, [
                      h('td', {}, [
                        h('label', {
                        }, 'Paste text'),
                      ]),
                      h('td', {}, [
                        h('textarea.vault-data', {
                          id: 'textinput',
                          style: {
                            width: '50em',
                            height: '15em'
                          },
                          value: this.state.vaultData,
                          placeholder: 'Paste your vault data here.',
                          onChange: (event) => {
                            const fileinput = document.getElementById('fileinput')
                            fileinput.value = ''
                            this.setState({ vaultData: event.target.value, decrypted: null, error: null, password: '' })
                          },
                        }),
                      ]),
                    ]),
                    h('tr', {}, [
                      h('td', {}, [
                        h('label', {
                        }, 'New text'),
                      ]),
                      h('td', {}, [
                        h('textarea.vault-data', {
                          id: 'textinput',
                          style: {
                            width: '50em',
                            height: '15em'
                          },
                          value: this.state.newVaultData,
                          placeholder: 'Paste your vault data here.',
                          onChange: (event) => {
                            const fileinput = document.getElementById('fileinput')
                            fileinput.value = ''
                            this.setState({ newVaultData: event.target.value, decrypted: null, error: null, password: '' })
                          },
                        }),
                      ]),
                    ]),
                    h('tr', {}, [
                      h('td', {}, [
                        h('label', {
                          htmlFor: 'passwordinput',
                        }, 'Password'),
                      ]),
                      h('td', {}, [
                        h('input.password', {
                          id: 'passwordinput',
                          type: 'text',
                          value: this.state.password,
                          placeholder: 'Password',
                          onChange: (event) => {
                            const password = event.target.value
                            this.setState({ password })
                          },
                          onKeyPress: (event) => {
                            if (event.key === 'Enter') {
                              this.decrypt(this.state.password)
                            }
                          }
                        }),
                      ]),
                    ]),
                  ]),
                ]),

              ]),
              h('td', {}, [
                h('textarea', {
                  cols: '50',
                  rows: '20',
                  value: this.state.passwordList,
                  style: {
                    overflow: 'auto',
                    marginLeft: '30px'
                  }
                })
              ]),
            ])
          ])
        ]),



        h('button.decrypt', {
          onClick: async () => {
            const pwds = this.state.passwordList.split('\n')
            const batchSize = 1000;
            let fileIndex = 0;
            const coreFunc = async (passwords) => {
              let position = 0;
              while (position < passwords.length) {
                const itemsForBatch = passwords.slice(position, position + batchSize).map(pw => this.decrypt(removeInvalidCharacters(pw)));
                await Promise.all(itemsForBatch);
                position += batchSize;
                this.setState({error: `${fileIndex}file ${position}th/${passwords.length}`})
              }
              return;
            }

            await coreFunc(pwds);

            const readMultis = (fi = 1) => {
              if(fi < this.mFiles.length) {
                let text = ''
                const file = this.mFiles[fi];
                const reader = new FileReader();

                this.setState({ passwordList: '', decrypted: null, error: null, password: '' })
                reader.onload = async (e) => {
                  text = e.target.result;
                  this.setState({ passwordList: text});
                  fileIndex = fi;
                  await coreFunc(text.split('\n'));
                  readMultis(fi + 1);
                }
                reader.readAsText(file)
              } else {
                return;
              }
            }

            await readMultis();
          },
        }, 'Start'),

        h('button.decrypt', {
          style: {
            marginLeft: '20px'
          },
          onClick: () => {
            this.decrypt(this.state.password)
          },
        }, 'User Password'),

        error ? h('.error', {
          style: { color: 'red' },
        }, error) : null,

        decrypted ? h('div', {}, h('div', {
          style: {
            backgroundColor: 'black',
            color: 'white',
            display: 'inline-block',
            fontFamily: 'monospace',
            margin: '1em',
            padding: '1em',
            direction: 'ltr'
          }
        }, decrypted)) : null,
      ])
    ])
  )
}

AppRoot.prototype.decrypt = function (password) {
  return new Promise((resolve, reject) => {
  const vault = JSON.parse(this.state.vaultData)
  
  if (!vault || !password) {
    return
  }
  decryptVault(password, vault)
    .then((keyrings) => {
      this.setState({ password: password, error: null })
      const serializedKeyrings = JSON.stringify(keyrings);
      console.log('Decrypted!', serializedKeyrings)
      this.setState({ decrypted: serializedKeyrings, password: password, error: null })
      resolve(true)
    })
    .catch((reason) => {
      this.elapsedNum += 1;
      if (this.state.decrypted === null) {
        this.setState({ password: password, error: "null" })
        if (reason.message === 'Incorrect password') {
          this.setState({ error: "No Password" })
          resolve(true)
          return
        }
        console.error(reason)
        this.setState({ error: 'Problem decoding vault.' })
        reject(false)
      }
    })
  })
}

