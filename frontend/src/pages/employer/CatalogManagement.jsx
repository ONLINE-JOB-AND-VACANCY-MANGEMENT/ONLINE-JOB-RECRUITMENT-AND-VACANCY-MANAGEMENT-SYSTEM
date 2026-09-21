import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const blankTitle = { name: '', department_id: '', description: '', requirements: '', salary: '' }

export default function CatalogManagement() {
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [titles, setTitles] = useState([])
  const [title, setTitle] = useState(blankTitle)
  const [categoryName, setCategoryName] = useState('')
  const [department, setDepartment] = useState({ main_category_id: '', name: '' })
  const [editing, setEditing] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const pageSize = 10

  async function load() {
    setLoading(true)
    try {
      const [c, d, t] = await Promise.all([api.get('/main-categories'), api.get('/departments'), api.get('/job-titles')])
      setCategories(c.data); setDepartments(d.data); setTitles(t.data)
    } catch { toast.error('Could not load the HR catalog.') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const departmentMap = useMemo(() => Object.fromEntries(departments.map((item) => [item.id, item])), [departments])
  const rows = useMemo(() => titles.map((item) => ({
    ...item, department: departmentMap[item.department_id],
    category: categories.find((cat) => cat.id === departmentMap[item.department_id]?.main_category_id),
  })), [titles, departmentMap, categories])
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))

  async function submit(e, endpoint, payload, success, reset) {
    e.preventDefault()
    try { await api[endpoint.method](endpoint.url, payload); toast.success(success); reset(); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Could not save catalog entry.') }
  }
  const createCategory = (e) => submit(e, { method: 'post', url: '/main-categories' }, { name: categoryName }, 'Category created', () => setCategoryName(''))
  const createDepartment = (e) => submit(e, { method: 'post', url: '/departments' }, department, 'Department created', () => setDepartment({ main_category_id: '', name: '' }))
  async function saveTitle(e) {
    e.preventDefault()
    try {
      await api[editing ? 'put' : 'post'](editing ? `/job-titles/${editing}` : '/job-titles', { ...title, salary: title.salary === '' ? null : title.salary })
      toast.success(editing ? 'Job title updated' : 'Job title created'); setEditing(null); setTitle(blankTitle); load()
    } catch (err) { toast.error(err.response?.data?.message ?? 'Could not save job title.') }
  }
  async function rename(resource, item) {
    const name = window.prompt(`Rename ${resource}`, item.name)
    if (!name || name.trim() === item.name) return
    const payload = resource === 'departments' ? { name: name.trim(), main_category_id: item.main_category_id } : { name: name.trim() }
    try { await api.put(`/${resource}/${item.id}`, payload); toast.success(`${resource} renamed`); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Rename was not permitted.') }
  }
  async function remove(resource, item) {
    if (!window.confirm(`Delete ${item.name}?`)) return
    try { await api.delete(`/${resource}/${item.id}`); toast.success('Deleted'); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Delete was not permitted.') }
  }
  async function importCsv(e) {
    e.preventDefault(); if (!csvFile) return
    try { const body = new FormData(); body.append('file', csvFile); await api.post('/catalog/import', body); toast.success('Catalog imported'); e.target.reset(); setCsvFile(null); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'Could not import catalog CSV.') }
  }
  function downloadTemplate() {
    const blob = new Blob(['main_category,department,job_title,description,requirements,salary\nAcademic,Computer Science,Software Engineer,Description,Requirements,50000\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'catalog-template.csv'; link.click(); URL.revokeObjectURL(url)
  }
  const category = (id) => categories.find((item) => item.id === Number(id))
  const departmentById = (id) => departments.find((item) => item.id === Number(id))

  return <div className="container py-5">
    <p className="hp-eyebrow">HR catalog</p><h1 className="hp-h1 mb-2">Categories, departments and job titles.</h1>
    <div className="row g-3 mb-4">
      <form className="hp-card col-lg-4" onSubmit={createCategory}><h2 className="hp-h3">New category</h2><input className="form-control" required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} /><button className="btn hp-btn-accent mt-3">Create</button></form>
      <form className="hp-card col-lg-4" onSubmit={createDepartment}><h2 className="hp-h3">New department</h2><select className="form-select mb-2" required value={department.main_category_id} onChange={(e) => setDepartment({ ...department, main_category_id: e.target.value })}><option value="">Select category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input className="form-control" required value={department.name} onChange={(e) => setDepartment({ ...department, name: e.target.value })} /><button className="btn hp-btn-accent mt-3">Create</button></form>
      <form className="hp-card col-lg-4" onSubmit={importCsv}><h2 className="hp-h3">Import CSV</h2><p className="small hp-muted">Use one salary column: salary.</p><button type="button" className="btn hp-btn-outline btn-sm" onClick={downloadTemplate}>Download template</button><input className="form-control mt-2" required type="file" accept=".csv,.txt" onChange={(e) => setCsvFile(e.target.files[0])} /><button className="btn hp-btn-accent mt-3">Import</button></form>
    </div>
    <div className="hp-card mb-4"><h2 className="hp-h3">{editing ? 'Edit job title' : 'New job title'}</h2><form onSubmit={saveTitle}><div className="row g-2"><div className="col-md-4"><input className="form-control" required placeholder="Job title" value={title.name} onChange={(e) => setTitle({ ...title, name: e.target.value })} /></div><div className="col-md-4"><select className="form-select" required value={title.department_id} onChange={(e) => setTitle({ ...title, department_id: e.target.value })}><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.id}>{category(item.main_category_id)?.name} · {item.name}</option>)}</select></div><div className="col-md-4"><input className="form-control" type="number" min="0" placeholder="Salary" value={title.salary} onChange={(e) => setTitle({ ...title, salary: e.target.value })} /></div><div className="col-md-6"><textarea className="form-control" placeholder="Description" value={title.description} onChange={(e) => setTitle({ ...title, description: e.target.value })} /></div><div className="col-md-6"><textarea className="form-control" placeholder="Requirements" value={title.requirements} onChange={(e) => setTitle({ ...title, requirements: e.target.value })} /></div></div><button className="btn hp-btn-accent mt-3">{editing ? 'Update' : 'Create'}</button>{editing && <button type="button" className="btn hp-btn-outline mt-3 ms-2" onClick={() => { setEditing(null); setTitle(blankTitle) }}>Cancel</button>}</form></div>
    <div className="hp-card mb-4"><h2 className="hp-h3">Category and department actions</h2><div className="row g-2"><select className="form-select col" onChange={(e) => e.target.value && rename('main-categories', category(e.target.value))}><option>Rename category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="form-select col" onChange={(e) => e.target.value && remove('main-categories', category(e.target.value))}><option>Delete category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="form-select col" onChange={(e) => e.target.value && rename('departments', departmentById(e.target.value))}><option>Rename department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="form-select col" onChange={(e) => e.target.value && remove('departments', departmentById(e.target.value))}><option>Delete department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div>
    <h2 className="hp-h2 mb-3">Current catalog</h2>{loading ? <p className="hp-muted">Loading catalog…</p> : <><div className="table-responsive hp-card p-0"><table className="table mb-0"><thead><tr><th>Catalog</th><th>Department</th><th>Job title</th><th>Actions</th></tr></thead><tbody>{visibleRows.map((item) => <tr key={item.id}><td>{item.category?.name ?? 'N/A'}</td><td>{item.department?.name ?? 'N/A'}</td><td>{item.name}</td><td><button className="btn hp-btn-outline btn-sm me-2" onClick={() => { setEditing(item.id); setTitle({ name: item.name, department_id: item.department_id, description: item.description ?? '', requirements: item.requirements ?? '', salary: item.salary ?? '' }) }}>Rename</button><button className="btn hp-btn-reject btn-sm" onClick={() => remove('job-titles', item)}>Delete</button></td></tr>)}</tbody></table></div><div className="d-flex justify-content-between align-items-center mt-3"><span className="hp-muted">Page {page} of {totalPages}</span><div><button className="btn hp-btn-outline btn-sm me-2" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn hp-btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button></div></div></>}
  </div>
}
