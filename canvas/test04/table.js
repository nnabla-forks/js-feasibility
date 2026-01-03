console.log(data);

function redrawTable() {
    console.log('redrawTable');
    const table = document.getElementById('table');
    console.log(table);
    table.innerHTML = '';
    let tr = document.createElement('tr');
    let th = document.createElement('th');
    th.classList.add("title");
    th.colSpan = 72
    th.textContent = "GAIA usage information";
    tr.appendChild(th);
    table.appendChild(tr);
    for (let key in data) {
        tr = document.createElement('tr');
        th = document.createElement('th');
        th.classList.add("title");
        th.colSpan = 72
        th.textContent = key;
        tr.appendChild(th);
        table.appendChild(tr);
        let num_of_nodes = data[key].length;
        let num_of_rows = ((num_of_nodes + 7) >> 3);
        console.log("LEN:" + num_of_nodes + ":" + num_of_rows);
        for( let row = 0; row < num_of_rows; row++ ) {
            console.log(row)
            tr = document.createElement('tr');
            for( let col=0; col < 8; col++ ) {
                console.log(row, col)
                let td = document.createElement('td');
                node_index = (col * num_of_rows) + row;
                if (node_index >= num_of_nodes) {
                    node_index = -1;
                    td.colSpan = 9
                } else {
                    td.classList.add("name");
                    td.textContent = node_index
                }
                tr.appendChild(td);
                if (node_index >= 0) {
                    n = data[key][node_index]
                    if (n['gpus'].length == 0) {
                        td = document.createElement('td');
                        td.classList.add("status");
                        td.colSpan = 8
                        td.textContent = n['status'];
                        tr.appendChild(td);
                    } else {
                        for( let i=0; i < 8; i++ ) {
                            td = document.createElement('td');
                            td.classList.add("item");
                            td.textContent = n['gpus'][i];
                            tr.appendChild(td);
                        }
                    }
                }
                //const index = col * 8 + row;
                //if( index < num_of_nodes ) {
                //    td.textContent = data[key][index]['name'] + ':' + data[key][index]['status'] + ';' + data[key][index]['gpus'].length;
                //}
                //tr.appendChild(td);
            }
            table.appendChild(tr);
        }
    }
    // data[key].forEach((node) => {
    //         const td = document.createElement('td');
    //         td.textContent = node['name'] + ':' + node['status'] + ';' + node['gpus'].length;
    //         tr.appendChild(td);
    //     });
    //     table.appendChild(tr);
    // }
}

// for (let key in data) {
//     console.log(key);
//     data[key].forEach((node) => {
//         console.log(node['name'] + ':' + node['status'] + ';' + node['gpus'].length);
//     });
// }


