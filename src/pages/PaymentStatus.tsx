import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const trackingId = searchParams.get('trackingId');
  const jobId = searchParams.get('jobId');
  const navigate = useNavigate();
  
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      if (status !== 'success' || !jobId) {
        setProcessing(false);
        return;
      }

      try {
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          const jobData = jobSnap.data();
          
          // Only update if it's currently pending payment
          if (jobData.status === 'pending_payment') {
            await updateDoc(jobRef, {
              status: 'active',
              paymentTrackingId: trackingId,
              activatedAt: serverTimestamp()
            });

            // Trigger job alerts
            try {
              const alertsSnapshot = await getDocs(collection(db, 'jobAlerts'));
              alertsSnapshot.forEach(async (alertDoc) => {
                const alert = alertDoc.data();
                if (alert.userId === jobData.employerId) return; // Don't notify the employer
                
                let matches = true;
                if (alert.location && !jobData.location.toLowerCase().includes(alert.location.toLowerCase())) matches = false;
                if (alert.industry && !jobData.industry.toLowerCase().includes(alert.industry.toLowerCase())) matches = false;
                if (alert.type && alert.type !== 'All' && jobData.type !== alert.type) matches = false;
                
                if (alert.skills && alert.skills.length > 0) {
                  const hasSkill = alert.skills.some((s: string) => 
                    (jobData.skills || []).map((sk: string) => sk.toLowerCase()).includes(s.toLowerCase()) ||
                    jobData.description.toLowerCase().includes(s.toLowerCase())
                  );
                  if (!hasSkill) matches = false;
                }
                
                if (matches) {
                  await addDoc(collection(db, 'notifications'), {
                    userId: alert.userId,
                    type: 'job_alert',
                    title: 'New Job Match!',
                    message: `${jobData.company} just posted a ${jobData.title} role that matches your alert.`,
                    link: `/jobs/${jobId}`,
                    read: false,
                    createdAt: serverTimestamp()
                  });
                }
              });
            } catch (err) {
              console.error("Error checking alerts:", err);
            }
          }
        }
      } catch (err: any) {
        console.error("Error processing payment status:", err);
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [status, trackingId, jobId]);

  return (
    <div className="min-h-screen bg-[#062016]/5 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border border-[#062016]/10">
        {processing ? (
          <div className="py-8">
            <div className="w-12 h-12 border-4 border-[#062016] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold">Processing your payment...</p>
          </div>
        ) : status === 'success' ? (
          <div>
            <div className="w-20 h-20 bg-[#bef264]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#062016]" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#062016] mb-2 tracking-tight">Payment Successful!</h2>
            <p className="text-slate-500 mb-6 font-medium">Your job has been posted and is now live on AlphaHunt.</p>
            {trackingId && (
              <div className="bg-[#062016]/5 p-4 rounded-xl mb-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transaction ID</p>
                <p className="font-mono text-[#062016] font-bold">{trackingId}</p>
              </div>
            )}
            <button 
              onClick={() => navigate('/jobs')}
              className="w-full bg-[#062016] text-white px-6 py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-[#062016]/10 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Job Board
            </button>
          </div>
        ) : (
          <div>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#062016] mb-2 tracking-tight">Payment Failed</h2>
            <p className="text-slate-500 mb-6 font-medium">
              {error || "Something went wrong with your payment. Please try again."}
            </p>
            <button 
              onClick={() => navigate('/jobs')}
              className="w-full bg-[#062016] text-white px-6 py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-[#062016]/10 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" /> Return to Job Board
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
