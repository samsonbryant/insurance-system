import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { verificationAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { QrCode, Camera, RefreshCw } from 'lucide-react'

const QRScanner = () => {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)

  const handleScan = async (qrData) => {
    try {
      setScanning(true)
      // Parse QR code data (assuming it contains policy_number and holder_name)
      const data = JSON.parse(qrData)
      const response = await verificationAPI.verifyDocument({
        policy_number: data.policy_number,
        holder_name: data.holder_name,
        holder_id_number: data.holder_id_number || '',
        verification_purpose: 'qr_scan',
      })
      setResult(response)
      toast.success('Verification completed')
    } catch (error) {
      console.error('Error scanning QR:', error)
      toast.error('Failed to verify QR code')
    } finally {
      setScanning(false)
    }
  }

  const handleManualInput = () => {
    navigate('/verify')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>

      <div className="card">
        <div className="text-center py-12">
          <QrCode className="h-24 w-24 text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            Use your device camera to scan a QR code from an insurance policy document
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setScanning(!scanning)}
              className="btn btn-primary flex items-center gap-2"
              disabled={scanning}
            >
              <Camera className="h-4 w-4" />
              {scanning ? 'Scanning...' : 'Start Scanner'}
            </button>
            <button
              onClick={handleManualInput}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Manual Input
            </button>
          </div>
        </div>

        {scanning && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Note: Web camera access for QR scanning requires browser permissions. 
              For now, please use the manual input option or scan using the mobile app.
            </p>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded-lg border-l-4 ${
            result.status === 'valid'
              ? 'bg-green-50 border-green-500'
              : result.status === 'fake'
              ? 'bg-red-50 border-red-500'
              : 'bg-yellow-50 border-yellow-500'
          }`}>
            <h3 className="font-semibold text-gray-900 mb-2">
              Verification {result.status === 'valid' ? 'Valid' : result.status === 'fake' ? 'Invalid' : 'Pending'}
            </h3>
            <p className="text-sm text-gray-600">
              Policy: {result.policy_number || 'N/A'}
            </p>
            {result.verification && (
              <button
                onClick={() => navigate(`/verifications/${result.verification.id}`)}
                className="mt-4 btn btn-primary"
              >
                View Details
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default QRScanner
