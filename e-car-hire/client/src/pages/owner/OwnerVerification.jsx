import React, { useState, useEffect } from 'react'
import Title from '../../components/owner/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const OwnerVerification = () => {
  const { user, axios, fetchUser } = useAppContext()

  const [form, setForm] = useState({
    aadharNumber: '',
    panNumber:    '',
    bankAccount:  '',
    ifscCode:     '',
    upiId:        '',
  })

  const [aadharFile, setAadharFile] = useState(null)
  const [rcFile,     setRcFile]     = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)
  const [loading,    setLoading]    = useState(false)

  // Pre-fill saved values
  useEffect(() => {
    if (user) {
      setForm({
        aadharNumber: user.aadharNumber || '',
        panNumber:    user.panNumber    || '',
        bankAccount:  user.bankAccount  || '',
        ifscCode:     user.ifscCode     || '',
        upiId:        user.upiId        || '',
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!aadharFile) return toast.error('Please upload your Aadhar card')
    if (!rcFile)     return toast.error('Please upload your RC book')
    if (!selfieFile) return toast.error('Please upload a selfie with your ID')

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('aadharNumber', form.aadharNumber)
      fd.append('panNumber',    form.panNumber)
      fd.append('bankAccount',  form.bankAccount)
      fd.append('ifscCode',     form.ifscCode)
      fd.append('upiId',        form.upiId)
      fd.append('aadharDoc',    aadharFile)
      fd.append('rcBook',       rcFile)
      fd.append('selfie',       selfieFile)

      const { data } = await axios.post('/api/owner/submit-verification', fd)
      if (data.success) {
        toast.success(data.message)
        fetchUser()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  // ── Shorthand for cleaner JSX ──────────────────────────────────────────
  const verStatus = user?.ownerVerification?.status

  return (
    <div className='px-4 pt-10 md:px-10 flex-1 max-w-2xl'>
      <Title
        title='Owner Verification'
        subTitle='Submit your documents and bank details to start listing cars and receiving payments.'
      />

      {/* ── Status Banners ──────────────────────────────────────────────── */}
      {verStatus === 'pending' && (
        <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700'>
          <strong>Under Review</strong> — Your verification is being reviewed. We will notify you by email once approved.
        </div>
      )}
      {verStatus === 'verified' && (
        <div className='mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700'>
          <strong>Verified Owner</strong> — You are fully verified and can list and manage your cars.
        </div>
      )}
      {verStatus === 'rejected' && (
        <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
          <strong>Verification Rejected</strong> — Reason: {user?.ownerVerification?.rejectReason || 'Please contact support.'} Please correct your documents and resubmit.
        </div>
      )}

      <form onSubmit={handleSubmit} className='mt-6 space-y-5'>

        {/* ── Identity Details ──────────────────────────────────────────── */}
        <div className='p-5 border border-borderColor rounded-xl bg-white'>
          <h3 className='font-semibold text-gray-800 mb-4'>📋 Identity Details</h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
                Aadhar Number <span className='normal-case text-red-400'>*required</span>
              </label>
              <input
                type='text'
                maxLength={12}
                value={form.aadharNumber}
                onChange={e => setForm(p => ({ ...p, aadharNumber: e.target.value.replace(/\D/g, '') }))}
                placeholder='12-digit Aadhar number'
                required
                className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm focus:outline-none focus:border-primary transition-all'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
                PAN Number
              </label>
              <input
                type='text'
                maxLength={10}
                value={form.panNumber}
                onChange={e => setForm(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                placeholder='e.g. ABCDE1234F'
                className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm focus:outline-none focus:border-primary transition-all'
              />
            </div>
          </div>
        </div>

        {/* ── Bank / Payment Details ─────────────────────────────────────── */}
        <div className='p-5 border border-borderColor rounded-xl bg-white'>
          <h3 className='font-semibold text-gray-800 mb-1'>Bank / Payment Details</h3>
          <p className='text-xs text-gray-400 mb-4'>
            This is where your escrow money will be released after each successful car handover.
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
                Bank Account Number <span className='normal-case text-red-400'>*required</span>
              </label>
              <input
                type='text'
                value={form.bankAccount}
                onChange={e => setForm(p => ({ ...p, bankAccount: e.target.value }))}
                placeholder='Your account number'
                required
                className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm focus:outline-none focus:border-primary transition-all'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
                IFSC Code <span className='normal-case text-red-400'>*required</span>
              </label>
              <input
                type='text'
                maxLength={11}
                value={form.ifscCode}
                onChange={e => setForm(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                placeholder='e.g. SBIN0001234'
                required
                className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm focus:outline-none focus:border-primary transition-all'
              />
            </div>
            <div className='sm:col-span-2'>
              <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
                UPI ID <span className='normal-case text-gray-400'>(optional)</span>
              </label>
              <input
                type='text'
                value={form.upiId}
                onChange={e => setForm(p => ({ ...p, upiId: e.target.value }))}
                placeholder='yourname@upi'
                className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm focus:outline-none focus:border-primary transition-all'
              />
            </div>
          </div>
        </div>

        {/* ── Document Uploads ───────────────────────────────────────────── */}
        <div className='p-5 border border-borderColor rounded-xl bg-white'>
          <h3 className='font-semibold text-gray-800 mb-4'>Document Uploads</h3>
          <div className='space-y-4'>
            {[
              { label: 'Aadhar Card (Front & Back)', state: aadharFile, setter: setAadharFile },
              { label: 'Vehicle RC Book',             state: rcFile,     setter: setRcFile     },
              { label: 'Selfie with Aadhar Card',     state: selfieFile, setter: setSelfieFile },
            ].map(({ label, state, setter }) => (
              <div key={label}>
                <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
                  {label} <span className='normal-case text-red-400'>*required</span>
                </label>
                <div className={`border-2 border-dashed rounded-lg p-3 flex items-center gap-3 transition-all
                  ${state ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-primary'}`}>
                  <input
                    type='file'
                    accept='image/*,.pdf'
                    onChange={e => setter(e.target.files[0])}
                    className='text-sm text-gray-500 w-full cursor-pointer'
                  />
                  {state && (
                    <span className='text-green-600 text-xs whitespace-nowrap font-medium'>
                      {state.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Submit — hide if pending or already verified ───────────────── */}
        {verStatus !== 'pending' && verStatus !== 'verified' && (
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 bg-primary text-white rounded-xl font-medium
              hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2'
          >
            {loading
              ? <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Submitting...</>
              : 'Submit for Verification'}
          </button>
        )}

        {/* ── Resubmit allowed after rejection ──────────────────────────── */}
        {verStatus === 'rejected' && (
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium
              transition-all disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2'
          >
            {loading
              ? <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Resubmitting...</>
              : 'Resubmit Documents'}
          </button>
        )}

      </form>
    </div>
  )
}

export default OwnerVerification