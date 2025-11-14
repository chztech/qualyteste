import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="text-sm text-gray-600 space-x-1">
            <span>© 2025</span>
            <a
              href="https://www.qualycorpore.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:underline"
            >
              QUALYCORPORE
            </a>
            <span>- Todos os direitos reservados. by</span>
            <a
              href="https://chztech.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:underline"
            >
              CHZTECH ASSESSORIA DIGITAL
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
