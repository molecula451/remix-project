import Web3 from 'web3'
import remixDebug, { TransactionDebugger as Debugger } from '@remix-project/remix-debug'
<<<<<<< HEAD
import { CompilerAbstract } from '@remix-project/remix-solidity'

=======
import { CompilationOutput, Sources } from '@remix-ui/debugger-ui'
import { lineText } from '@remix-ui/editor'
import type { CompilationResult } from '@remix-project/remix-solidity-ts'
>>>>>>> show inline gas cost

export const DebuggerApiMixin = (Base) => class extends Base {

  initialWeb3

  initDebuggerApi () {
    const self = this
    this.web3Provider = {
      sendAsync (payload, callback) {
        self.call('web3Provider', 'sendAsync', payload)
          .then(result => callback(null, result))
          .catch(e => callback(e))
      }
    }
    this._web3 = new Web3(this.web3Provider)
    // this._web3 can be overwritten and reset to initial value in 'debug' method
    this.initialWeb3 = this._web3
    remixDebug.init.extendWeb3(this._web3)

    this.offsetToLineColumnConverter = {
      async offsetToLineColumn (rawLocation, file, sources, asts) {
        return await self.call('offsetToLineColumnConverter', 'offsetToLineColumn', rawLocation, file, sources, asts)
      }
    }
  }

  // on()
  // call()
  // onDebugRequested()
  // onRemoveHighlights()

  web3 () {
    return this._web3
  }

  async discardHighlight () {
    await this.call('editor', 'discardHighlight')
    await this.call('editor', 'discardLineTexts' as any)
  }

  async highlight (lineColumnPos, path, rawLocation, stepDetail) {
    await this.call('editor', 'highlight', lineColumnPos, path, '', { focus: true })
    const label = `${stepDetail.op} - ${stepDetail.gasCost} gas - ${stepDetail.gas} gas left`
    const linetext: lineText = {
        content: label,
        position: lineColumnPos,
        hide: false,
        className: 'text-muted small',
        afterContentClassName: 'text-muted small fas fa-gas-pump pl-4',
        from: 'debugger',
        hoverMessage: [{
            value: label,
        },
        ],
    }
    await this.call('editor', 'addLineText' as any, linetext, path)
  }

  async getFile (path) {
    return await this.call('fileManager', 'getFile', path)
  }

  async setFile (path, content) {
    await this.call('fileManager', 'setFile', path, content)
  }

  onBreakpointCleared (listener) {
    this.onBreakpointClearedListener = listener
  }

  onBreakpointAdded (listener) {
    this.onBreakpointAddedListener = listener
  }

  onEditorContentChanged (listener) {
    this.onEditorContentChangedListener = listener
  }

  onEnvChanged (listener) {
    this.onEnvChangedListener = listener
  }

  onDebugRequested (listener) {
    this.onDebugRequestedListener = listener
  }

  onRemoveHighlights (listener) {
    this.onRemoveHighlightsListener = listener
  }

  async fetchContractAndCompile (address, receipt) {
    const target = (address && remixDebug.traceHelper.isContractCreation(address)) ? receipt.contractAddress : address
    const targetAddress = target || receipt.contractAddress || receipt.to
    const codeAtAddress = await this._web3.eth.getCode(targetAddress)
    const output = await this.call('fetchAndCompile', 'resolve', targetAddress, codeAtAddress, '.debug')
    if (output) {
      return new CompilerAbstract(output.languageversion, output.data, output.source)
    }
    return null
  }

  async getDebugWeb3 () {
    let web3
    let network
    try {
      network = await this.call('network', 'detectNetwork')    
    } catch (e) {
      web3 = this.web3()
    }
    if (!web3) {
      const webDebugNode = remixDebug.init.web3DebugNode(network.name)
      web3 = !webDebugNode ? this.web3() : webDebugNode
    }
    remixDebug.init.extendWeb3(web3)
    return web3
  }

  async getTrace (hash) {
    if (!hash) return
    const web3 = await this.getDebugWeb3()
    const currentReceipt = await web3.eth.getTransactionReceipt(hash)
    const debug = new Debugger({
      web3,
      offsetToLineColumnConverter: this.offsetToLineColumnConverter,
      compilationResult: async (address) => {
        try {
          return await this.fetchContractAndCompile(address, currentReceipt)
        } catch (e) {
          console.error(e)
        }
        return null
      },
      debugWithGeneratedSources: false
    })
    return await debug.debugger.traceManager.getTrace(hash)
  }

  debug (hash, web3?) {
    try {
      this.call('fetchAndCompile', 'clearCache')
    } catch (e) {
      console.error(e)
    }
    if (web3) this._web3 = web3
    else this._web3 = this.initialWeb3
    remixDebug.init.extendWeb3(this._web3)
    if (this.onDebugRequestedListener) this.onDebugRequestedListener(hash, web3)
  }

  onActivation () {
    this.on('editor', 'breakpointCleared', (fileName, row) => { if (this.onBreakpointClearedListener) this.onBreakpointClearedListener(fileName, row) })
    this.on('editor', 'breakpointAdded', (fileName, row) => { if (this.onBreakpointAddedListener) this.onBreakpointAddedListener(fileName, row) })
    this.on('editor', 'contentChanged', () => { if (this.onEditorContentChangedListener) this.onEditorContentChangedListener() })  
    this.on('network', 'providerChanged', (provider) => { if (this.onEnvChangedListener) this.onEnvChangedListener(provider) })
  }

  onDeactivation () {
    if (this.onRemoveHighlightsListener) this.onRemoveHighlightsListener()
    this.off('editor', 'breakpointCleared')
    this.off('editor', 'breakpointAdded')
    this.off('editor', 'contentChanged')
  }

  showMessage (title: string, message: string) {}

  onStartDebugging () {
    this.call('layout', 'maximiseSidePanel')
  }

  onStopDebugging () {
    this.call('layout', 'resetSidePanel')
  }
}

