class TableComponent extends HTMLElement {
    constructor() {
        super();
        this.nullCharacter = "x"
        this.attachShadow({mode: 'open'})
         this.table = document.createElement("table")
        this.shadowRoot.append(this.table)
    }

    static get observedAttributes() {
        return ['columns','data','summary','fill-data-rules'];
    }

    attributeChangedCallback(name, oldValue, newValue) {

        switch(name){
            case 'columns':{
                this.createTableHeaders()
                break
            }
            case 'data':{
                this.insertAllData()
                this.getSummary()
                this.applyFillDataRules()
                break
            }
            case 'summary':{
                this.getSummary()
                break
            }
            case 'fill-data-rules':{
                this.applyFillDataRules()
                this.getSummary()
                break
            }
        }
        console.log(`Changed ${name} from ${oldValue} to ${newValue}`);
    }

    connectedCallback(){
        this.createTableHeaders()
        this.insertAllData()
        this.applyFillDataRules()
        this.getSummary()

        let attributes = this.getAttributeNames().map(
            (attr) => {
                return {'attribute': attr, 'value': this.getAttribute(attr)}
            });

        console.table(attributes);
    }
    createTableHeaders() {
        if(!this.getAttribute('columns')) throw new Error("Columns attribute missing")
        if(this.table.tHead) this.table.tHead.remove()
        const columns = this.getAttribute('columns').split(',')   
        const tableHead = this.table.createTHead()
        const row = tableHead.insertRow(0)
        this.insertRowData(row,columns)
        this.createSortingListeners(row)
    }
    createSortingListeners(row){
        for(let whichColumn = 0;whichColumn < row.cells.length;++whichColumn){
            row.cells[whichColumn].addEventListener("click",()=>{
                sortData(whichColumn)
            })
        }
        let sortData = (byWhichColumn)=>{
            let switching, i, firstCompared, secondCompared, shouldSwitch, direction, switchCount = 0;
            switching = true;
            direction = "asc";
            while (switching) {
                switching = false;
                let rows = this.table.tBodies[0].rows;
                for (i = 0; i < (rows.length - 1); ++i) {
                    shouldSwitch = false;
                    firstCompared = rows[i].cells[byWhichColumn];
                    secondCompared = rows[i + 1].cells[byWhichColumn];
                    if (direction == "asc") {
                        if(!isNaN(+firstCompared.textContent)){
                            if(+firstCompared.textContent > +secondCompared.textContent) {
                                shouldSwitch = true
                                break}
                        }else{
                            if(firstCompared.textContent.toLowerCase() > secondCompared.textContent.toLowerCase()){
                                shouldSwitch = true
                                break} 
                        }
                    } else if (direction == "desc") {
                        if(!isNaN(+firstCompared.textContent)){
                            if(+firstCompared.textContent < +secondCompared.textContent) {
                                shouldSwitch = true
                                break}
                        }else{
                            if(firstCompared.textContent.toLowerCase() < secondCompared.textContent.toLowerCase()){
                            shouldSwitch = true
                            break} 
                        }
                    }
                }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i])
            switching = true
            ++switchCount
        }else {
            if (switchCount == 0 && direction == "asc") {
                direction = "desc"
                switching = true }
            }
            }
        }
    }

    insertAllData(){
        if(!this.getAttribute('data')) throw new Error("Data attribute missing")
        if(this.table.tBodies[0]) this.table.tBodies[0].remove()
        const allDataString = this.getAttribute('data')
        const dataSplitToRows = allDataString.split(';')
        const tableBody = this.table.createTBody()
        for(let i = 0;i < dataSplitToRows.length;++i){
            const dataSplitToCells = dataSplitToRows[i].split(',')
            let row = tableBody.insertRow(i)
            this.insertRowData(row,dataSplitToCells)
        }
    }
    insertRowData(row,dataArray){
        let i = 0
        dataArray.forEach(element => {
            let cell = row.insertCell(i)
            if(element === "") cell.textContent = this.nullCharacter
            else cell.textContent = element
            ++i
        });
    }
    getSummary(){
        if(this.table.tFoot) this.table.tFoot.remove()
        if(!this.getAttribute('summary')) return
        const typesOfAggregationInString = this.getAttribute('summary')
        const typesOfAggregationInArray = typesOfAggregationInString.split(',')
        let summaryDataArray = []
        let i = 0
        typesOfAggregationInArray.forEach(element =>{
            summaryDataArray.push(this.getValueForSummarizedColumnsFooter(element,i)) 
            ++i
        })
        
        const tableFooter = this.table.createTFoot()
        let row = tableFooter.insertRow(0)
        this.insertRowData(row,summaryDataArray)
    }
    getValueForSummarizedColumnsFooter(typeOfSummary, whichColumn){
        
        let getSumFromArray = (array)=>{
            let sum = 0
            for(let i = 0;i < array.length;++i){
                if(this.whetherEqualsNullCharacter(array[i])) sum += 0
                else sum += +array[i]
            }
            return sum
        }
        let getNonNullArrayLength = (array)=>{
            let nonNullLength = 0
                    array.forEach(element=>{
                        if(!this.whetherEqualsNullCharacter(element)) nonNullLength++
                    })
            return nonNullLength
        }

        switch(typeOfSummary.toLowerCase()){
            case 'count':{
                const columnDataArray = this.getColumnData(whichColumn)
                let set = new Set()
                columnDataArray.forEach(element=>{
                    if(!this.whetherEqualsNullCharacter(element)) set.add(element)
                })
                return set.size
            }
            case 'avg':{
                const columnDataArray = this.getColumnData(whichColumn)
                return (getSumFromArray(columnDataArray)/getNonNullArrayLength(columnDataArray)).toFixed(2)
            }
            case 'sum':{
                const columnDataArray = this.getColumnData(whichColumn)
                return getSumFromArray(columnDataArray)
            }
            default:{
                return '-'
            }
        }
    }
    
    getColumnData(whichColumn) {
        let valueForCellsInSelectedColumn = []
        for(let i = 0;i < this.table.tBodies.length;++i){
            const tableBodyRows = this.table.tBodies[i]
            for(let j = 0;j < tableBodyRows.rows.length;++j){
                valueForCellsInSelectedColumn.push(tableBodyRows.rows[j].cells[whichColumn].textContent) 
            }
        }
            return valueForCellsInSelectedColumn
    }
    applyFillDataRules(){
        if(!this.getAttribute('fill-data-rules')) return
        const rulesString = this.getAttribute('fill-data-rules')
        const rulesArray = rulesString.split(',')
        for(let i = 0;i < rulesArray.length;++i){
            const regExpToMatch = new RegExp("[0-9]+=[0-9]+[+*\/-][0-9]+")
            if(!regExpToMatch.test(rulesArray[i])) throw new Error("Incorrect syntax in fill-data-rule " + rulesArray[i])
            const operationSign = rulesArray[i].charAt(3)
            const digitsArray = rulesArray[i].split(/[=+*\/-]/)
            const first = this.getColumnData(digitsArray[1]) 
            const second = this.getColumnData(digitsArray[2]) 
            let arrayToInsert = []
            switch(operationSign){
                case "*":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(+first[j]*(+second[j]))
                    }
                }
                case "/":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(+first[j]/(+second[j]))
                    }
                }
                case "+":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(+first[j]+(+second[j]))
                    }
                }
                case "-":{
                    for(let j = 0;j < first.length;++j){
                        arrayToInsert.push(first[j]-(+second[j]))
                    }
                }
                default:{
                    break
                }
            }
            this.changeValuesInColumn(+digitsArray[0], arrayToInsert)
        }
    }
    changeValuesInColumn(whichColumn, arrayWithData){
        let allTheRows = 0
        for(let bodiesIterator = 0;bodiesIterator < this.table.tBodies.length;++bodiesIterator){
            const column = this.table.tBodies[bodiesIterator]
            for(let rowsIterator = 0;rowsIterator < column.rows.length;++rowsIterator){
                if(this.whetherEqualsNullCharacter(column.rows[rowsIterator].cells[whichColumn].textContent)){
                    column.rows[rowsIterator].cells[whichColumn].textContent = arrayWithData[allTheRows]
                }
                ++allTheRows
            }
        }
    }
    whetherEqualsNullCharacter(value){
        if(value === this.nullCharacter) return true
        else return false
    }
    disconnectedCallback() {
        console.log(`Disconnecting!`);
        this.destroy();
    }

    destroy() {
        this.innerHTML = '';
    }
}

customElements.define('table-component', TableComponent);