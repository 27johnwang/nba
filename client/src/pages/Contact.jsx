import { Mail } from 'lucide-react'

const Contact = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Contact Us</h1>

      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-nyu-violet" />
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">Get in Touch</h2>

          <p className="text-gray-600 mb-6">
            Have questions, feedback, or need help? We'd love to hear from you!
          </p>

          <a
            href="mailto:nyumealswipe@gmail.com"
            className="inline-flex items-center gap-2 bg-nyu-violet text-white px-6 py-3 rounded-lg hover:bg-nyu-violet-dark transition-colors font-medium"
          >
            <Mail size={20} />
            nyumealswipe@gmail.com
          </a>

          <p className="text-sm text-gray-500 mt-6">
            We typically respond within 24 hours.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Contact
