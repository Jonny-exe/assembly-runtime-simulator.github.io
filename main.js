console.log("HELLO")

const isNumeric = (num) => (typeof(num) === 'number' || typeof(num) === "string" && num.trim() !== '') && !isNaN(num);
var parser;

function updateCurrentInstruction(line) {
	var tableBody = document.getElementById("codeTableBody")
	for (var i = 0; i < tableBody.children.length; i++) {
		tableBody.children[i].style.backgroundColor = "white"
	}
	console.log(line)
	tableBody.children[line].style.backgroundColor = "#FFCCCB"
}
function initCodeTable(codeLines) {
	var tableBody = document.getElementById("codeTableBody")
	for (var i = 0; i < codeLines.length; i++) {
		var tr = document.createElement("tr")
		var td1 = document.createElement("td")
		var td2 = document.createElement("td")
		td1.innerText = i
		td2.innerText = codeLines[i]
		tr.appendChild(td1)
		tr.appendChild(td2)
		tableBody.appendChild(tr)
	}
}

function initTable(tableId) {
	var tableBody = document.getElementById(tableId+"Body")
	var y = 0
	if (tableId == "memTable") {
		y = 64
	} else if (tableId == "rTable") {
		y = 16
	} 

	for (var i = 0; i < y; i++) {
		var tr = document.createElement("tr")
		var td1 = document.createElement("td")
		var td2 = document.createElement("td")
		tr.appendChild(td1)
		tr.appendChild(td2)
		tableBody.appendChild(tr)
	}
}

function updateTable(tableId, data) {
	var tableBody = document.getElementById(tableId+"Body")
	var y = 0
	if (tableId == "memTable") {
		y = 64
	} else if (tableId == "rTable") {
		y = 16
	}  else if (tableId == "codeTable") {
		y = parser.codeLines.length;
	}
	console.log(tableBody)
	console.log(tableBody.children)
	for (var i = 0; i < y; i++) {
		if (data[i] == null) data[i] = "null"
		tableBody.children[i].children[0].innerText = "#" + i
		if (tableBody.children[i].children[1].innerText != data[i])
			tableBody.children[i].children[1].style.backgroundColor = "#90EE90"
		else
			tableBody.children[i].children[1].style.backgroundColor = "white"

		tableBody.children[i].children[1].innerText = data[i]
	}

}

function init() {
	eventListeners()	
	initTable("memTable")
	initTable("rTable")
	initTable("codeTable")
}


function eventListeners() {
	const codeSubmitButton = document.getElementById("codeSubmit")
	const codeNextButton = document.getElementById("codeNext")
	const codeSubmitInput = document.getElementById("codeInput")

	codeSubmitButton.addEventListener(("click"), () => {
		code = codeSubmitInput.value
		parser = new Simulation(code)
	})

	codeNextButton.addEventListener(("click"), () => {
		parser.next()
	})
}

class Simulation {
	parsed_lines = []
	raw_lines = {}
	markers = {}

	r = []
	mem = []
	mem_used_idx = 0
	mem_store = {}
	pc = 0
	stop = false

	operations = {
	  	add: function (self, out, a, b) { self.r[out] = self.r[a] + self.r[b] },
		addi: function (self, out, a, b) { self.r[out] = self.r[a] + b },
		sub: function (self, out, a, b) { self.r[out] = self.r[a] - self.r[b] },
		subi: function (self, out, a, b) { self.r[out] = self.r[a] - b },
		mul: function (selfout, a, b) { self.r[out] = self.r[a] * self.r[b] },
		muli: function (self, out, a, b) { self.r[out] = self.r[a] * b },
		mov: function (self, a, b) { self.r[a] = self.r[b] },
		movi: function (self, a, b) { self.r[a] = b },
		ld: function (self, a, b) { self.r[a] = self.mem[b] },
		ldx: function (self, a, b, c) { self.r[a] = self.mem[b+c] },
		st: function (self, a, b) { self.mem[a] = self.r[b] },
		stx: function (self, a, b, c) { self.mem[a] = self.r[b+c] },
		jmp: function (self, a) { self.pc = a },
		retm: function (self) { self.exit() },
		bls: function (self, a, b) { if (a<0)  self.pc = b },
		ble: function (self, a, b) { if (a<=0) self.pc = b },
		bgt: function (self, a, b) { if (a>0)  self.pc = b },
		bge: function (self, a, b) { if (a>=0) self.pc = b },
		beq: function (self, a, b) { if (a==0) self.pc = b }
	}

	constructor(code) {

		this.code = code
		this.codeLines = code.split("\n")
		for (var i = 0; i < 16; i++) {
			this.r.push(null)
		}
		for (var i = 0; i < 64; i++) {
			this.mem.push(null)
		}
		initCodeTable(this.codeLines)
		this.parse()
	}

	parse() {
		var lines = code.split("\n")
		console.log("lines: ", lines)
		var line_idx = 0
		//forEach(line => {
		for (var j = 0; j < lines.length; j++) {
			var line = lines[j]
		// for (var line of lines) {
			line = line.trim()
			var elements = line.split(/[\s,]+/)
			if (elements.length == 0)
				continue
			elements = elements.map((x) => x.trim())


			// check if marker
			if (elements[0][elements[0].length-1] == ":") {
				//check if main
				this.markers[elements[0].substr(0, elements[0].length-1)] = line_idx
				var marker = elements[0]
				elements = elements.slice(1)
				if (marker == "main:") {
					this.pc = line_idx
					continue
				}
				if (elements[0] == ".value" || elements[0] == ".word") {
					this.mem_store[marker.substr(0, -1)] = this.mem_used_idx
					if (elements[0] == ".word") {
						this.mem_used_idx += Number(elements[1])
					} else {
						for (var i = 1; i < elements.length; i++) {
							this.mem[this.mem_used_idx] = elements[i]
							this.mem_used_idx++;
						}
					}
					continue
				}
			}
			// TODO: check for incorrect things
			this.parsed_lines.push(elements)
			this.raw_lines[line_idx] = j;
			line_idx++;
		}
	}


	next() {
		console.log(this.parsed_lines, this.pc)
		var oldPc = this.pc
		this.execute(this.parsed_lines[this.pc])
		if (oldPc == this.pc) {
			this.pc++;
		}

		if (this.stop)
			return
		updateCurrentInstruction(this.raw_lines[this.pc])
		updateTable("memTable", this.mem)
		updateTable("rTable", this.r)
	}

	execute(instruction) {
		console.log(instruction)
		var operation_types = {
			arithmetic: ["add", "addi", "sub", "subi", "mul", "muli"],
			memory: ["mov", "movi", "st", "stx", "ld", "ldx"],
			pc: ["jmp"],
			conditions: ["ble", "bls", "bgt", "bge", "beq"],
			finish: ["retm"]
		}

		for (var i = 1; i < instruction.length; i++) {
			if (instruction[i][0] == "r" && isNumeric(instruction[i].substr(1, instruction[i].length))) {
				instruction[i] = Number(instruction[i].substr(1, instruction[i].length))
			} else if (instruction[i][0] == "#") {
				instruction[i] = Number(instruction[i].substr(1, instruction[i].length))
			} else if (Object.keys(this.mem_store).includes(instruction[i].substr(0, instruction[i].length))) {
				instruction[i] = this.mem_store[instruction[i]]
			}
		}

		console.log("instruction: ", instruction[0])

		if (operation_types.arithmetic.includes(instruction[0])) {
			this.operations[instruction[0]](this, instruction[1], instruction[2], instruction[3])
		} else if (operation_types.memory.includes(instruction[0])) {
			this.operations[instruction[0]](this, instruction[1], instruction[2])
		} else if (operation_types.pc.includes(instruction[0])) {
			console.log("marker: ", instruction[1], this.markers[instruction[1]])
			this.operations[instruction[0]](this, this.markers[instruction[1]])
			console.log("pc", 	this.pc)
		} else if (operation_types.conditions.includes(instruction[0])) {
			this.operations[instruction[0]](this, instruction[1], this.markers[instruction[2]])
		} else if (operation_types.finish.includes(instruction[0])) {
			console.log("HELLO")
			this.operations[instruction[0]](this)
		}
	}

	exit() {
		this.stop = true
		document.getElementById("codeNext").disabled = true;
	}

}


init()