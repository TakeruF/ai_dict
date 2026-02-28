//
//  LiquidGlassUIViewController.swift
//  App
//
//  Created by Takeru on 2026/02/28.
//

import UIKit
import SwiftUI

final class LiquidGlassUIViewController: UIViewController {
    
    private var safeAreaObserver: NSKeyValueObservation?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure view
        view.backgroundColor = .clear
        
        // Create header
        let headerView = UIView()
        headerView.backgroundColor = UIColor(white: 1, alpha: 0.1)
        headerView.layer.backdropFilter = UIBlurEffect(style: .light).inputAccessoryView
        
        view.addSubview(headerView)
        headerView.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            headerView.topAnchor.constraint(equalTo: view.topAnchor),
            headerView.leftAnchor.constraint(equalTo: view.leftAnchor),
            headerView.rightAnchor.constraint(equalTo: view.rightAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 56 + (view.safeAreaInsets.top))
        ])
        
        // Create label
        let titleLabel = UILabel()
        titleLabel.text = "AI Dict"
        titleLabel.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
        titleLabel.textColor = .label
        
        headerView.addSubview(titleLabel)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            titleLabel.leftAnchor.constraint(equalTo: headerView.leftAnchor, constant: 16),
            titleLabel.bottomAnchor.constraint(equalTo: headerView.bottomAnchor, constant: -12)
        ])
        
        // Create bottom bar
        let bottomBar = UIView()
        bottomBar.backgroundColor = UIColor(white: 1, alpha: 0.1)
        
        view.addSubview(bottomBar)
        bottomBar.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            bottomBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            bottomBar.leftAnchor.constraint(equalTo: view.leftAnchor),
            bottomBar.rightAnchor.constraint(equalTo: view.rightAnchor),
            bottomBar.heightAnchor.constraint(equalToConstant: 100 + (view.safeAreaInsets.bottom))
        ])
    }
}
    

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
